import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '../config/default.js';
import { prisma } from '../config/prismaClient.js';
import { upload, ValidateSupportingPDF } from '../helpers/multerConfig.js';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import { getBlackSpotInsertData, getSegmentInsertData } from "../utils/uccUtil.js";
import { ALLOWED_TYPES_OF_WORK } from "../constants/stringConstant.js";

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

  console.log("req", req.file, "body", req.body);

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
        created_by: user_id.toString(),
        status: "Draft",
      },
    }),
  ]);

  if (!uploadFileResult || uploadFileResult.$metadata.httpStatusCode !== STATUS_CODES.OK) {
    throw new APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED);
  }

  return savedFile;
};

export const uploadMultipleFileService = async (req, res) => {

  await new Promise((resolve, reject) => {

    ValidateSupportingPDF.array('files', 10)(req, res, (err) => {

      if (err) {
        return reject(
          new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_PDF_FILE_TYPE)
        );
      }
      resolve();
    });
  });

  if (!req.files || req.files.length === 0) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.NO_FILES_UPLOADED);
  }

  // Validate user existence (if user_id is required)
  const user_id = req.user?.user_id;
  if (!user_id) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  // file upload
  const uploadedFilesPromises = req.files.map(async (file) => {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `supporting_document/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    // Upload the file to S3
    const uploadFileResult = await s3Client.send(command);

    if (!uploadFileResult || uploadFileResult.$metadata.httpStatusCode !== STATUS_CODES.OK) {

      throw new APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED);
      
    }

    const savedFile = await prisma.supporting_documents.create({
      data: {
        document_type: "pdf",
        document_name: file.originalname,
        document_path: params.Key,
        key_name: "",
        is_deleted: false,
        created_by: user_id.toString(),
        status: "Draft",
      },
    });

    return savedFile; // Return the saved file metadata
  });

  try {
    const savedFiles = await Promise.all(uploadedFilesPromises);
    return savedFiles
    // return res.status(STATUS_CODES.OK).json({
    //   files: savedFiles,
    // });
  } catch (error) {
    console.error(error);
    throw new APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED);
  }
};


/**
 * Fetches the file from the S3 bucket and retrieves its details from the database.
 * It returns the file stream (from S3) and the file name for use in the download response.
 *
 * @param {Object} req - The Express request object. Used for logging purposes.
 * @param {string} userId - The ID of the user whose file is being fetched.
 * 
 * @returns {Object} - Returns an object containing the S3 file stream (`data.Body`) and the file name.
 * 
 * @throws {APIError} - Throws an error if the file record is not found or an S3 request fails.
 */
export async function getFileFromS3(req, userId) {
  try {
    logger.info("Fetching document detail from DB");
    const fileRecord = await prisma.supporting_documents.findFirst({
      where: {
        created_by: userId.toString(),
        is_deleted: false
      },
      select: {
        document_id: true,
        document_path: true,
        document_name: true,
        is_deleted: true,
      }
    });

    if (!fileRecord) {
      throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND);
    }

    logger.info("Document detail fetched successfully.")
    const fileKey = fileRecord.document_path;
    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    };

    logger.info("Fetching File from S3 bucket.")
    const command = new GetObjectCommand(getObjectParams);
    const data = await s3Client.send(command);
    const fileName = fileKey.split('/').pop();
    logger.info("File fetched successfully from S3 bucket.")

    return { data: data.Body, fileName };
  } catch (error) {
    logger.error({
      message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
      error: error,
      url: req.url,
      method: req.method,
      time: new Date().toISOString(),
    });
    throw err;
  }
}

export async function insertTypeOfWork(req, userId, reqBody) {
  try {
    const dataToInsert = [];

    // Insert segment data
    for (const [typeOfWork, workData] of Object.entries(reqBody)) {
      if (!ALLOWED_TYPES_OF_WORK.includes(typeOfWork)) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, `Invalid typeOfWork: ${typeOfWork}`);
      }

      // Fetch the type_of_work ID from the database based on the typeOfWork
      const typeOfWorkRecord = await prisma.type_of_work.findFirst({
        where: {
          name_of_work: typeOfWork,
        },
      });

      if (!typeOfWorkRecord) {
        throw new APIError(STATUS_CODES.NOT_FOUND, `type_of_work ${typeOfWork} not found in database`);
      }
      const typeOfWorkId = typeOfWorkRecord.ID;


      if (Array.isArray(workData)) {
        // Dynamically handle the insertion for segment or blackSpot based on the typeOfWork
        workData.forEach((item) => {
          if (item.typeOfForm === 'segment') {
            const segmentData = getSegmentInsertData(item, typeOfWorkId, userId);
            dataToInsert.push(segmentData);
          } else if (item.typeOfForm === 'blackSpot') {
            const blackSpotData = getBlackSpotInsertData(item, typeOfWorkId, userId);

            dataToInsert.push(blackSpotData);
          }
        });
      }
    }

    const result = await prisma.ucc_type_of_work_location.createMany({
      data: dataToInsert,
    });

    return result;
  } catch (err) {
    throw err;
  }
}
export const deleteFileService = async (id) => {

  const result = await prisma.supporting_documents.findUnique({
    where: {
      document_id: id,
    },
  });
  if (result.is_deleted == true) {
    return { alreadyDeleted: true };
  }
  if (!result) {
    throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND);
  }
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: result.document_path,
  }
  // delete file from s3
  const s3result = await s3Client.send(new DeleteObjectCommand(params));
  if (s3result.$metadata.httpStatusCode !== 204) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR)
  }
  const deletedResult = await prisma.supporting_documents.update({
    where: {
      document_id: id,
    },
    data: {
      is_deleted: true,
    },
  });
  return deletedResult
}

export const getAllImplementationModes = async () => {
  const allModes = await prisma.ucc_implementation_mode.findMany();
  return allModes
};
export const insertContractDetails = async (req) => {
  const { shortName, piu, implementationId, schemeId, contractName,roId,stateId } = req.body;
  const userId = req.user?.user_id;
  if (!userId) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  const existingContract = await prisma.ucc_master.findFirst({
    where: {
      created_by: userId,
      status: "Draft",
    },
  });

  if(existingContract) {
    throw new APIError(STATUS_CODES.CONFLICT, RESPONSE_MESSAGES.ERROR.DRAFT_ALREADY_EXISTS);
  }

  const result = await prisma.ucc_master.create({
    data: {
      short_name: shortName,
      piu_id: piu,
      implementation_mode_id: implementationId,
      scheme_id: schemeId,
      created_by: userId,
      status: "Draft",
      project_name: contractName,
      ro_id:roId,
      state_id:stateId
    },
    select: {
      ucc_id: true
    }
  });


  if (piu?.length) {
    await prisma.ucc_piu.createMany({
      data: piu.map((piu_id) => ({
        ucc_id: result.ucc_id,
        piu_id,
        created_by: userId,
      })),
    });
  }
  return result;

}
