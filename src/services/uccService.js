import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../config/default.js";
import { prisma } from "../config/prismaClient.js";
import { upload, ValidateSupportingPDF } from "../helpers/multerConfig.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import {
  calculateSegmentLength,
  getBlackSpotInsertData,
  getSegmentInsertData,
} from "../utils/uccUtil.js";
import { ALLOWED_TYPES_OF_WORK, STRING_CONSTANT, TYPE_OF_ISSUES } from "../constants/stringConstant.js";
import { STATUS } from "../constants/appConstants.js";
import { getStretchPiuRoAndState } from "./stretchService.js";

export const uploadFileService = async (req, res) => {
  await new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return reject(
          new APIError(
            STATUS_CODES.BAD_REQUEST,
            RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE
          )
        );
      }
      resolve();
    });
  });

  const user_id = req.user?.user_id;
  if (!user_id) {
    throw new APIError(
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND
    );
  }

  if (!req.body.document_type) {
    throw new APIError(
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR.DOCUMENT_TYPE_NOT_FOUND
    );
  }

  if (!req.file) {
    throw new APIError(
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND
    );
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

  if (
    !uploadFileResult ||
    uploadFileResult.$metadata.httpStatusCode !== STATUS_CODES.OK
  ) {
    throw new APIError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED
    );
  }

  return savedFile;
};

export const uploadMultipleFileService = async (req, res) => {
  await new Promise((resolve, reject) => {
    ValidateSupportingPDF.array("files", 10)(req, res, (err) => {
      if (err) {
        return reject(
          new APIError(
            STATUS_CODES.BAD_REQUEST,
            RESPONSE_MESSAGES.ERROR.INVALID_PDF_FILE_TYPE
          )
        );
      }
      resolve();
    });
  });

  if (!req.files || req.files.length === 0) {
    throw new APIError(
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR.NO_FILES_UPLOADED
    );
  }

  // Validate user existence (if user_id is required)
  const user_id = req.user?.user_id;
  if (!user_id) {
    throw new APIError(
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND
    );
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
        ucc_id:req.body.ucc_id,
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
    return savedFiles;
    // return res.status(STATUS_CODES.OK).json({
    //   files: savedFiles,
    // });
  } catch (error) {
    console.error(error);
    throw new APIError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED
    );
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
        is_deleted: false,
      },
      select: {
        document_id: true,
        document_path: true,
        document_name: true,
        is_deleted: true,
      },
    });

    if (!fileRecord) {
      throw new APIError(
        STATUS_CODES.NOT_FOUND,
        RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND
      );
    }

    logger.info("Document detail fetched successfully.");
    const fileKey = fileRecord.document_path;
    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    };

    logger.info("Fetching File from S3 bucket.");
    const command = new GetObjectCommand(getObjectParams);
    const data = await s3Client.send(command);
    const fileName = fileKey.split("/").pop();
    logger.info("File fetched successfully from S3 bucket.");

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
    const { stretchUsc, draftUccId, typeOfWorks } = reqBody;
    const workTypes = [];
    let resultName = '';
    let totalContractLength = 0;

    if (!Array.isArray(stretchUsc) || stretchUsc.length === 0) {
      throw new APIError(STATUS_CODES.BAD_REQUEST, 'Invalid or missing stretchUsc array.');
    }

    if (!Array.isArray(typeOfWorks) || typeOfWorks.length === 0) {
      throw new APIError(STATUS_CODES.BAD_REQUEST, 'Invalid or missing typeOfWorks array.');
    }

    const stretchStatePiuRoData = await getStretchPiuRoAndState(stretchUsc);

    const stretchRecords = await prisma.Stretches.findMany({
      where: {
        StretchID: { in: stretchStatePiuRoData.stretchId }
      },
      select: {
        ProjectName: true,
      },
    });

    const projectNames = stretchRecords.map(record => record.ProjectName);

    for (const work of typeOfWorks) {
      const { workType, segment, blackSpot } = work;
      workTypes.push(workType);

      if (!ALLOWED_TYPES_OF_WORK.includes(workType)) {
        throw new APIError(
          STATUS_CODES.BAD_REQUEST,
          `Invalid workType: ${workType}`
        );
      }

      const typeOfWorkRecord = await prisma.type_of_work.findFirst({
        where: { name_of_work: workType },
      });

      if (!typeOfWorkRecord) {
        throw new APIError(
          STATUS_CODES.NOT_FOUND,
          `type_of_work ${workType} not found in database`
        );
      }

      const typeOfWorkId = typeOfWorkRecord.ID;

      if (Array.isArray(segment)) {
        const segmentNamePromises = segment.map(async (item, index) => {
          const segmentName = `${typeOfWorkRecord.name_of_work} on ${projectNames.join()} from ${item.startChainage.kilometer} + ${item.startChainage.meter} to ${item.endChainage.kilometer} + ${item.endChainage.meter}`;

          resultName += segmentName;
          if (index < segment.length - 1 || (blackSpot && blackSpot.length > 0)) {
            resultName += " and ";
          }

          const segmentLength = calculateSegmentLength(item.startChainage, item.endChainage);
          totalContractLength += segmentLength;

          const segmentData = await getSegmentInsertData(item, typeOfWorkId, userId, TYPE_OF_ISSUES.SEGMENT, draftUccId);
          return segmentData;
        });
        const resolvedSegmentData = await Promise.all(segmentNamePromises);
        dataToInsert.push(...resolvedSegmentData);
      }

      if (Array.isArray(blackSpot)) {
        const blackSpotNamePromises = blackSpot.map(async (item, index) => {
          const blackSpotName = `${typeOfWorkRecord.name_of_work} on ${projectNames.join()} from ${item.chainage.kilometer} + ${item.chainage.meter}`;

          resultName += blackSpotName;
          if (index < blackSpot.length - 1) {
            resultName += " and ";
          }

          const blackSpotData = await getBlackSpotInsertData(item, typeOfWorkId, userId, TYPE_OF_ISSUES.BLACK_SPOT, draftUccId);
          return blackSpotData;
        });
        const resolvedBlackSpotData = await Promise.all(blackSpotNamePromises);
        dataToInsert.push(...resolvedBlackSpotData);
      }
    }

    await prisma.ucc_type_of_work_location.createMany({
      data: dataToInsert,
    });

    logger.info("Type of work created successfully.");

    let uccId = draftUccId;
    if (!draftUccId) {
      const dbUccId = await prisma.ucc_master.create({
        data: {
          stretch_id: stretchUsc,
          status: STRING_CONSTANT.DRAFT,
        },
        select: { ucc_id: true },
      });
      uccId = dbUccId.ucc_id;
    }

    const formattedContractLength = (totalContractLength).toFixed(2);

    return {
      uccId,
      generatedName: resultName,
      contractLength: `${formattedContractLength} Km`,
      piu: stretchStatePiuRoData.piu.join(),
      ro: stretchStatePiuRoData.ro.join(),
      state: stretchStatePiuRoData.state.join()
    };
  } catch (err) {
    console.log("ERRRRRRRRRRR :::::::::::: ", err);
    logger.error(`Error in insertTypeOfWork: ${err.message}`);
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
    throw new APIError(
      STATUS_CODES.NOT_FOUND,
      RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND
    );
  }
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: result.document_path,
  };
  // delete file from s3
  const s3result = await s3Client.send(new DeleteObjectCommand(params));
  if (s3result.$metadata.httpStatusCode !== 204) {
    throw new APIError(
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR
    );
  }
  const deletedResult = await prisma.supporting_documents.update({
    where: {
      document_id: id,
    },
    data: {
      is_deleted: true,
    },
  });
  return deletedResult;
};

export const getAllImplementationModes = async () => {
  const allModes = await prisma.ucc_implementation_mode.findMany();
  return allModes;
};

export const insertContractDetails = async (req) => {
  const { shortName, piu, implementationId, schemeId, contractName, roId, stateId, contractLength } = req.body;
  const userId = req.user?.user_id;
  if (!userId) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  const existingContract = await prisma.ucc_master.findFirst({
    where: {
      created_by: userId,
      status: STATUS.DRAFT,
    },
  });

  if (existingContract) {
    throw new APIError(STATUS_CODES.CONFLICT, RESPONSE_MESSAGES.ERROR.DRAFT_ALREADY_EXISTS);
  }

  const result = await prisma.ucc_master.create({
    data: {
      short_name: shortName,
      piu_id: piu,
      implementation_mode_id: implementationId,
      scheme_id: schemeId,
      created_by: userId,
      status: STATUS.DRAFT,
      project_name: contractName,
      ro_id: roId,
      state_id: stateId,
      contract_length: contractLength
    },
    select: {
      ucc_id: true,
    },
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

export async function getMultipleFileFromS3(req, userId) {
  try {
    logger.info("Fetching multiple document details from DB");

    // Fetch all documents for the user that are not deleted
    const fileRecords = await prisma.supporting_documents.findMany({
      where: {
        created_by: userId.toString(),
        ucc_id: req.params.ucc_id,
        is_deleted: false,
      },
      select: {
        document_id: true,
        document_path: true,
        document_name: true,
      },
    });

    // If no files found, throw an error
    if (!fileRecords || fileRecords.length === 0) {
      throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_FILES_FOUND);
    }

    logger.info(`Found ${fileRecords.length} document(s).`);

    // Process each file and fetch from S3
    const files = await Promise.all(fileRecords.map(async (fileRecord) => {
      try {
        const fileKey = fileRecord.document_path;
        const getObjectParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        };

        logger.info(`Fetching file with key: ${fileKey} from S3 bucket.`);

        const command = new GetObjectCommand(getObjectParams);

        const data = await s3Client.send(command);

        // Extract the file name from the file path
        const fileName = fileKey.split('/').pop();
        logger.info(`File ${fileName} fetched successfully from S3.`);

        return { data: data.Body, fileName };
      } catch (fileError) {
        // Log error specific to each file
        logger.error({
          message: `Error fetching file: ${fileRecord.document_name}`,
          error: fileError,
          url: req.url,
          method: req.method,
          time: new Date().toISOString(),
        });
        // Return error information for that file
        return { error: `Error fetching file: ${fileRecord.document_name}`, fileName: fileRecord.document_name };
      }
    }));

    return files; // Return the array of files (or errors)
  } catch (error) {
    logger.error({
      message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
      error: error,
      url: req.url,
      method: req.method,
      time: new Date().toISOString(),
    });
    throw error;
  }
}

export const deleteMultipleFileService = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, 'No file IDs provided for deletion.');
  }

  const deletionResults = [];

  for (const id of ids) {

    try {
      // Fetch the file record from the database
      const result = await prisma.supporting_documents.findUnique({
        where: { document_id: id },
      });

      if (!result) {
        deletionResults.push({ id, error: 'File not found' });
        continue;
      }

      if (result.is_deleted) {
        deletionResults.push({ id, error: 'File already deleted' });
        continue;
      }

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: result.document_path,
      };

      // Delete the file from S3
      const s3result = await s3Client.send(new DeleteObjectCommand(params));

      if (s3result.$metadata.httpStatusCode !== 204) {
        deletionResults.push({ id, error: 'Failed to delete file from S3' });
        continue;
      }


      const deletedResult = await prisma.supporting_documents.update({
        where: { document_id: id },
        data: { is_deleted: true },
      });

      deletionResults.push({ id, success: true });

    } catch (error) {
      deletionResults.push({ id, error: error.message || 'An unexpected error occurred' });
    }
  }

  // Return the summary of deletion attempts
  return deletionResults;
};

export const getcontractListService = async (req) => {
  const { stretchIds, piu, ro, program, phase, typeOfWork, scheme, corridor } = req.body;
  const userId = req.user?.user_id;
  if (!userId) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  const result = await prisma.UCCSegments.findMany({
    where: {
      StretchID: {
        in: stretchIds,
      },
      ...(piu?.length ? { PIU: { in: piu } } : {}),
      ...(ro?.length ? { RO: { in: ro } } : {}),
      ...(program?.length ? { ProgramName: { in: program } } : {}),
      ...(phase?.length ? { PhaseCode: { in: phase } } : {}),
      ...(typeOfWork?.length ? { TypeofWork: { in: typeOfWork } } : {}),
      ...(scheme?.length ? { Scheme: { in: scheme } } : {}),
      ...(corridor?.length ? { CorridorID: { in: corridor } } : {}),
    },
    distinct: ['UCC'],
    select: {
      TypeofWork: true,
      StretchID: true,
      ProjectName: true,
      PIU: true,
      UCC: true,
      TotalLength: true,
      RevisedLength: true,
    },
  });

  const finalContractList = await result.map((item) => {
    item.status = "awarded";
    return item
  });
  return finalContractList;

}

export const basicDetailsOnReviewPage = async () => {
  try {
    const uccRecord = await prisma.ucc_master.findUnique({
      where: { ucc_id: 1 },
      select: {
        contract_name: true,
        short_name: true,
        implementation_mode: true,
        contract_length: true,
        created_by: true,
        piu_id: true, // This comes directly from ucc_master
        ml_states: {
          select: {
            state_name: true,
          },
        },
        scheme_master: {
          select: {
            scheme_name: true,
          },
        },
        or_office_master: {
          select: {
            office_name: true,
          },
        },
        ucc_implementation_mode: {
          select: {
            mode_name: true,
          },
        },
      },
    });

    if (!uccRecord) {
      return {
        status: false,
        message: "UCC record not found",
        data: null,
      };
    }

    // Get piu_id directly from uccRecord
    const piuIds = uccRecord.piu_id || [];

    // Fetch details of these piu_ids from or_office_master
    const piuDetails = await prisma.or_office_master.findMany({
      where: {
        office_id: { in: piuIds },
      },
      select: {
        office_id: true,
        office_name: true,
      },
    });

    const type_of_work = await prisma.ucc_type_of_work_location.findMany({
      where: {
        user_id: uccRecord.created_by,
      },
      select: {
        type_of_issue: true,
        start_distance_km: true,
        start_distance_metre: true,
        end_distance_km: true,
        end_distance_metre: true,
        start_distance_km: true,
      },
    });

    const data = {
      contract_name: uccRecord.contract_name,
      short_name: uccRecord.short_name,
      implementation_mode: uccRecord.implementation_mode,
      contract_length: uccRecord.contract_length,
      piu_details: piuDetails, // Details of each piu_id
      ml_states: uccRecord.ml_states.state_name.scheme_name,
      scheme_master: uccRecord.scheme_master.scheme_name,
      or_office_master: uccRecord.or_office_master.office_name,
      type_of_work: type_of_work,
      // supporting_documents: supporting_documents
    };
    return data;
  } catch (error) {
    console.error("Error fetching UCC record:", error);
    return {
      status: false,
      message: "An error occurred while fetching UCC record",
      data: null,
    };
  }
};

