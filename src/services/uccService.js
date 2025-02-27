import { PutObjectCommand } from "@aws-sdk/client-s3";
import {prisma} from '../config/prismaClient.js';
import {upload} from '../helpers/multerConfig.js';
import APIError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { s3Client } from '../config/default.js';

export const uploadFileService = async (req, res) => {
  await new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return reject(
          new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE)
        );
      }
      resolve();
    });
  });

  const user_id = req.user?.user_id;
  if (!user_id) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  if (!req.body.document_type) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.DOCUMENT_TYPE_NOT_FOUND);
  }

  if (!req.file) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND);
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);

  const [uploadFileResult, savedFile] = await Promise.all([
    s3Client.send(command),
    prisma.supporting_documents.create({
      data: {
        document_type: req.body.document_type,
        document_name: req.file.originalname,
        document_path: params.Key,
        created_by: user_id,
        status: "Draft",
      },
    }),
  ]);

  if (!uploadFileResult || uploadFileResult.$metadata.httpStatusCode !== STATUS_CODES.OK) {
    throw new APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED);
  }

  return savedFile;
};