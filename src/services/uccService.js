import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../config/default.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
import { exportToCSV } from "../utils/exportUtil.js";

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

  const draftUccId = req.body.draftUccId;
  const stretchUsc = req.body.stretchUsc;

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
    Key: `${process.env.S3_MAIN_FOLDER}/${process.env.S3_SUB_FOLDER}/${Date.now()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);

  const uploadFileResult = await s3Client.send(command);

  if (
    !uploadFileResult ||
    uploadFileResult.$metadata.httpStatusCode !== STATUS_CODES.OK
  ) {
    throw new APIError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED
    );
  }

  let uccId = draftUccId;

  if (uccId == "null" || !uccId) {

    const dbUccId = await prisma.ucc_master.create({
      data: {
        stretch_id: JSON.parse(stretchUsc),
        status: STRING_CONSTANT.DRAFT,
      },
      select: { ucc_id: true },
    });

    uccId = dbUccId.ucc_id;
  }
  const savedFile = await prisma.documents_master.create({
    data: {
      document_type: req.body.document_type,
      document_name: req.file.originalname,
      key_name: params.Key,
      document_path: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
      created_at: new Date(),
      is_deleted: false,
      created_by: user_id.toString(),
      status: STRING_CONSTANT.DRAFT,
      module_type_id: parseInt(uccId),
      module_type: STRING_CONSTANT.UCC
    },
  });

  return { uccId: JSON.parse(uccId), savedFile };
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
      acl: 'public-read',
      Key: `${process.env.S3_MAIN_FOLDER}/${process.env.S3_SUB_FOLDER}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    // Upload the file to S3
    const uploadFileResult = await s3Client.send(command);

    if (!uploadFileResult || uploadFileResult.$metadata.httpStatusCode !== STATUS_CODES.OK) {
      throw new APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.FILE_UPLOAD_FAILED);
    }
const uccId = Number(req.body.ucc_id)
    const savedFile = await prisma.documents_master.create({
      data: {
        module_type_id: parseInt(uccId),
        module_type: STRING_CONSTANT.UCC,
        document_type: process.env.DOCUMENT_TYPE,
        document_name: file.originalname,
        document_path: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
        key_name: params.Key,
        is_deleted: false,
        created_by: user_id.toString(),
        created_at: new Date(),
        status: STRING_CONSTANT.DRAFT,
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
    const fileRecord = await prisma.documents_master.findFirst({
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

async function getStretchPiuRoAndStateBasedOnUserId(req) {
  try {
    const userId = req.user?.user_id;
    const uccIds = await fetchUccIdsForUser(userId, req);
    const piuRecords = await prisma.ucc_piu.findMany({
      where: {
        ucc_id: { in: uccIds },
      },
      select: {
        piu_id: true,
      },
    });

    const piuIds = [...new Set(piuRecords.map(record => record.piu_id))];
    
    if (piuIds.length === 0) {
      console.log("No PIUs found for the given UCC IDs.");
      return [];
    }

    const piuOffices = await prisma.or_office_master.findMany({
      where: {
        office_id: { in: piuIds },
        office_type: 'PIU',
      },
      select: {
        office_id: true,
        office_name: true,
        office_type: true,
        parent_id: true,
      },
    });

    const roIds = [...new Set(piuOffices.map(office => office.parent_id).filter(id => id !== null))];
    
    let roOffices = [];
    if (roIds.length > 0) {
      roOffices = await prisma.or_office_master.findMany({
        where: {
          office_id: { in: roIds },
          office_type: 'RO',
        },
        select: {
          office_id: true,
          office_name: true,
          office_type: true,
        },
      });
    }

    return { piuOffices, roOffices };
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches all ucc_ids associated with the given user_id.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<string[]>} - A list of ucc_id strings.
 */
async function fetchUccIdsForUser(userId, req) {
  logger.info({
    message: 'Fetching UCC IDs for the given user.',
    method: req.method,
    url: req.url,
    status: STRING_CONSTANT.SUCCESS,
    time: new Date().toISOString(),
  });
  const attendance = await prisma.ucc_user_mappings.findMany({
    where: {
      user_id: parseInt(userId),
    },
    select: {
      ucc_id: true,
    },
  });

  if (attendance.length === 0) {
    logger.info({
      message: "No Ucc found for the given user's user id.",
      method: req.method,
      url: req.url,
      status: STRING_CONSTANT.SUCCESS,
      time: new Date().toISOString(),
    });
    throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.SUCCESS.NO_UCC_FOUND);
  }

  const permanentUccIds = attendance.map(att => att.ucc_id);
  const uccRecords = await prisma.ucc_master.findMany({
    where: {
      permanent_ucc: { in: permanentUccIds },
    },
    select: {
      ucc_id: true,
    },
  });

  const uccIds = [...new Set(uccRecords.map(record => record.ucc_id))];

  return uccIds;
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

    const stretchStatePiuRoData = await getStretchPiuRoAndStateBasedOnUserId(req);
    const uccSegmentsData = await getStretchPiuRoAndState(stretchUsc);

    const roOffices = (stretchStatePiuRoData.roOffices || []).map(ro => ({
      id: ro.office_id,
      name: ro.office_name.replace(/^RO\s+/i, '')
    }));

    const stateData = await prisma.ml_states.findFirst({
      where: {
        state_name: roOffices[0].office_name
      },
      select: {
        state_id: true,
        state_name: true
      }
    });

    const stretchRecords = await prisma.Stretches.findMany({
      where: {
        StretchID: { in: uccSegmentsData.stretchId }
      },
      select: {
        ProjectName: true,
      },
    });

    const projectNames = stretchRecords.map(record => record.ProjectName);
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

          const segmentData = await getSegmentInsertData(item, typeOfWorkId, userId, TYPE_OF_ISSUES.SEGMENT, uccId);
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

          const blackSpotData = await getBlackSpotInsertData(item, typeOfWorkId, userId, TYPE_OF_ISSUES.BLACK_SPOT, uccId);
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

    const formattedContractLength = (totalContractLength).toFixed(2);

    await prisma.ucc_master.update({
      where: { ucc_id: uccId },
      data: {
        contract_name: resultName,
        project_name: resultName
      }
    });

    return {
      uccId,
      generatedName: resultName,
      contractLength: `${formattedContractLength} Km`,
      piu: (stretchStatePiuRoData.piuOffices || []).map(piu => ({
        id: piu.office_id,
        name: piu.office_name.replace(/^PIU\s+/i, '')
      })),
      ro: roOffices,
      state: stateData
    };
  } catch (err) {
    logger.error(`Error in insertTypeOfWork: ${err.message}`);
    throw err;
  }
}

export const deleteFileService = async (id) => {
  const result = await prisma.documents_master.findUnique({
    where: {
      document_id: id,
    },
  });
  if (!result) {
    throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.FILE_NOT_FOUND);
  }
  if (result.is_deleted == true) {
    return { alreadyDeleted: true };
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
  const deletedResult = await prisma.documents_master.update({
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
  const { shortName, piu, implementationId, schemeId, contractName, roId, stateId, contractLength, uccId } = req.body;
  const userId = req.user?.user_id;
  if (!userId) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  const existingContract = await prisma.ucc_master.findUnique({
    where: {
      ucc_id: uccId,
      status: STRING_CONSTANT.DRAFT,
    },
  });

  if (!existingContract) {
    throw new APIError(STATUS_CODES.CONFLICT, RESPONSE_MESSAGES.ERROR.CONTRACT_NOT_FOUND);
  }

  const result = await prisma.ucc_master.update({
    where: {
      ucc_id: uccId
    },
    data: {
      short_name: shortName,
      piu_id: piu,
      implementation_mode_id: implementationId,
      scheme_id: schemeId,
      updated_by: userId,
      status: STRING_CONSTANT.DRAFT,
      project_name: contractName,
      ro_id: roId,
      state_id: stateId,
      contract_length: contractLength,
      updated_at: new Date()
    },
  });
  if (piu?.length) {
    for (const piu_id of piu) {
      const existingPiu = await prisma.ucc_piu.findFirst({
        where: {
          ucc_id: uccId,
          piu_id: piu_id,
        },
      });

      if (existingPiu) {
        // Update the existing PIU record
        await prisma.ucc_piu.update({
          where: { id: existingPiu.id }, // Assuming `id` is the primary key of `ucc_piu`
          data: {
            updated_by: userId,
            updated_at: new Date(),
          },
        });
      } else {
        // Create a new PIU record
        await prisma.ucc_piu.create({
          data: {
            ucc_id: result.ucc_id,
            piu_id,
            created_by: userId,
          },
        });
      }
    }
  }
  return result;

}

export async function getMultipleFileFromS3(req, userId) {
  try {
    // Fetch all documents for the user that are not deleted
    const uccId = Number(req.query.ucc_id)
    const fileRecords = await prisma.documents_master.findMany({
      where: {
        created_by: userId.toString(),
        ucc_id: uccId,
        is_deleted: false,
      },
      select: {
        document_id: true,
        key_name: true,
        document_name: true,
        document_path: true,
        created_at: true,
        created_by: true,
        is_deleted: true,
        module_type_id: parseInt(uccId),
        module_type: STRING_CONSTANT.UCC,
        status: true
      },
      orderBy: {
        created_at: STRING_CONSTANT.DESC,
      },
    });

    // If no files found, throw an error
    if (!fileRecords || fileRecords.length === 0) {
      throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_FILES_FOUND);
    }

    return fileRecords; // Return the array of files (or errors)
  } catch (error) {
    logger.error({
      message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
      error: error.message,
      url: req.url,
      method: req.method,
      time: new Date().toISOString(),
    });
    throw error.message;
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
      const result = await prisma.documents_master.findUnique({
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


      const deletedResult = await prisma.documents_master.update({
        where: { document_id: id },
        data: { is_deleted: true },
      });

      deletionResults.push({ id, success: true });

    } catch (error) {
      deletionResults.push({ id, error: error.message || 'An unexpected error occurred' });
    }
  }

  return deletionResults;
};

export const getcontractListService = async (req, res) => {
  let { stretchIds, piu, ro, program, phase, typeOfWork, scheme, corridor, page = 1, limit = 10, exports, search } = req.body;
  const userId = req.user?.user_id;
  const designation = req.user?.designation;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;
  if (!userId) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
  }

  let whereClauses = [];
  let uccMasterWhereClause = [];

  if (stretchIds?.length > 0) {
    whereClauses.push(`"StretchID" IN (${stretchIds.map(id => `'${id}'`).join(',')})`);
    uccMasterWhereClause.push(`"stretch_id" && ARRAY[${stretchIds.map(id => `'${id}'`).join(',')}]::text[]`);
  } else {
    let getUserUccs = await prisma.ucc_user_mappings.findMany({
      where: { user_id: userId },
      select: { ucc_id: true },
    });

    getUserUccs = getUserUccs.map((item) => `'${item.ucc_id}'`);
    if (getUserUccs.length > 0) {
      whereClauses.push(`"UCC" IN (${getUserUccs.join(',')})`);
      uccMasterWhereClause.push(`"permanent_ucc" IN (${getUserUccs.join(',')})`);
    }
  }

  if (search?.length > 0) {
    whereClauses.push(`(
      "ProjectName" ILIKE '%${search}%'
      OR "PIU" ILIKE '%${search}%'
      OR "UCC" ILIKE '%${search}%'
      OR "TypeofWork" ILIKE '%${search}%'
    )`);
    uccMasterWhereClause.push(`(
      "contract_name" ILIKE '%${search}%'
      OR "piu_id"::text ILIKE '%${search}%'
      OR "permanent_ucc" ILIKE '%${search}%'
      OR "work_types"::text ILIKE '%${search}%'
    )`);
  }

  if (piu?.length) {
    whereClauses.push(`"PIU" IS NOT NULL AND "PIU" IN (${piu.map(p => `'${p}'`).join(",")})`);

    const officeIds = await prisma.or_office_master.findMany({
      where: { office_name: { in: piu } },
      select: { office_id: true },
    });
  
    const officeIdList = officeIds.map(o => o.office_id);
  
    // Step 2: Use these IDs in the filtering
    if (officeIdList.length > 0) {
      whereClauses.push(`"PIU" IS NOT NULL AND "PIU" IN (${piu.map(p => `'${p}'`).join(",")})`);
      uccMasterWhereClause.push(`"piu_id" && ARRAY[${officeIdList.join(",")}]::int[]`);
    }
  }
  if (ro?.length) {
    whereClauses.push(`"RO" IS NOT NULL AND "RO" IN (${ro.map(r => `'${r}'`).join(",")})`);
    uccMasterWhereClause.push(`"ro_id" IS NOT NULL AND "ro_id" IN (${ro.map(r => `'${r}'`).join(",")})`);
  }
  if (program?.length) {
    whereClauses.push(`"ProgramName" IS NOT NULL AND "ProgramName" IN (${program.map(p => `'${p}'`).join(",")})`);
    uccMasterWhereClause.push(`"project_code_id" IS NOT NULL AND "project_code_id" IN (${program.map(p => `'${p}'`).join(",")})`);
  }
  if (phase?.length) {
    whereClauses.push(`"PhaseCode" IS NOT NULL AND "PhaseCode" IN (${phase.map(p => `'${p}'`).join(",")})`);
    uccMasterWhereClause.push(`"phase_code_id" IS NOT NULL AND "phase_code_id" IN (${phase.map(p => `'${p}'`).join(",")})`);
  }
  if (typeOfWork?.length) {
    whereClauses.push(`"TypeofWork" IS NOT NULL AND "TypeofWork" IN (${typeOfWork.map(t => `'${t}'`).join(",")})`);
    uccMasterWhereClause.push(`"work_types" && ARRAY[${typeOfWork.map(t => `'${t}'`).join(",")}]::text[]`);
  }
  if (scheme?.length) {
    whereClauses.push(`"Scheme" IS NOT NULL AND "Scheme" IN (${scheme.map(s => `'${s}'`).join(",")})`);
    uccMasterWhereClause.push(`"scheme_id" IS NOT NULL AND "scheme_id" IN (${scheme.map(s => `'${s}'`).join(",")})`);
  }
  if (corridor?.length) {
    whereClauses.push(`"CorridorCode" IS NOT NULL AND "CorridorCode" IN (${corridor.map(c => `'${c}'`).join(",")})`);
    uccMasterWhereClause.push(`"corridor_code_id" IS NOT NULL AND "corridor_code_id" IN (${corridor.map(c => `'${c}'`).join(",")})`);
  }

  const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' OR ')}` : '';
  const uccMasterWhereCondition = uccMasterWhereClause.length > 0 ? `WHERE ${uccMasterWhereClause.join(' OR ')}` : '';

  const [gisContracts, masterContracts, totalCount] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT DISTINCT ON ("UCC") "UCC", "TypeofWork", "StretchID", "ProjectName", "PIU", 
        "TotalLength", "RevisedLength", "CorridorCode", "RO", "Scheme", 
        "PhaseCode", "ProgramName","ProjectStatus", public.ST_AsGeoJSON(geom) AS geojson
      FROM "nhai_gis"."UCCSegments"
      ${whereCondition}
      ORDER BY "UCC"
      LIMIT ${limit} OFFSET ${skip}
    `),
    prisma.$queryRawUnsafe(`
      SELECT 
        um."permanent_ucc" AS "UCC", 
        um."contract_name" AS "ProjectName", 
        STRING_AGG(oom."office_name", ', ') AS "PIU", -- Combine multiple PIU names if needed
        STRING_AGG(DISTINCT tow."name_of_work", ', ') AS "TypeofWork", 
        um."contract_length" AS "TotalLength",
        um."scheme_id" AS "Scheme", 
        um."corridor_code_id" AS "CorridorCode",
        um."phase_code_id" AS "PhaseCode", 
        um."project_name", 
        um."stretch_name", 
        um."stretch_id" AS "StretchID",
        um."status" AS "ProjectStatus"
      FROM "tenant_nhai"."ucc_master" um
      LEFT JOIN "tenant_nhai"."or_office_master" oom 
        ON oom."office_id" = ANY(um."piu_id")
        AND oom."office_type" = 'PIU'
      -- Join to fetch work type names
      LEFT JOIN "tenant_nhai"."ucc_type_of_work_location" utwl 
          ON utwl."ucc" = um."ucc_id"
      LEFT JOIN "tenant_nhai"."type_of_work" tow 
          ON utwl."type_of_work" = tow."ID"
      ${uccMasterWhereCondition}
      GROUP BY um."permanent_ucc", um."contract_name", 
               um."contract_length", um."scheme_id", um."corridor_code_id", 
               um."phase_code_id", um."project_name", um."stretch_name", 
               um."stretch_id", um."status"
      LIMIT ${limit} OFFSET ${skip}
    `),
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS count FROM "nhai_gis"."UCCSegments" ${whereCondition}
    `),
  ]);
  const combinedResults = [...gisContracts, ...masterContracts];
  const ids = combinedResults.map(item => item.StretchID).filter(Boolean);
  const stretchDetails = await prisma.Stretches.findMany({
    where: { StretchID: { in: ids.flat() } },
    select: { StretchID: true, ProjectName: true },
  });

  const stretchMap = stretchDetails.reduce((acc, item) => {
    acc[item.StretchID] = item.ProjectName;
    return acc;
  }, {});

  let finalContractList ;
  if(designation == STRING_CONSTANT.IT_HEAD){
   finalContractList = await Promise.all(result.map(async (item) => {
    const [editCount] = await Promise.all([
      prisma.ucc_change_log.count({
        where: { ucc_id: item.UCC }
      })
    ]);
  
    return {
      ...item,
      stretchName: stretchMap[item.StretchID] || item.stretch_name, // Add stretchName
      editCount // Add editCount
    };
  }));
}else{
  finalContractList = combinedResults.map((item) => ({
    ...item,
    stretchName: stretchMap[item.StretchID] || item.stretch_name,
  }));
}

  if (exports) {
    const headers = [
      { id: 'UCC', title: 'UCC' },
      { id: 'ProjectName', title: 'Contract Name' },
      { id: 'PIU', title: 'PIU' },
      { id: 'TypeofWork', title: 'Type of Work' },
      { id: 'TotalLength', title: 'Length' },
      { id: 'status', title: 'Status' }
    ];
    return await exportToCSV(res, finalContractList, STRING_CONSTANT.CONTRACT_DETAILS, headers);
  }

  return {
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount[0].count / limit),
    finalContractList,
  };
};


export const basicDetailsOnReviewPage = async (id, userId) => {
  try {
    const uccRecord = await prisma.ucc_master.findFirst({
      where: { id: id }, // Use `findFirst()` instead of `findUnique()`
      select: {
        ucc_id: true,
        contract_name: true,
        short_name: true,
        implementation_mode_id: true,
        contract_length: true,
        created_by: true,
        piu_id: true, // This comes directly from ucc_master
        // state_id: true,
        scheme_master: {
          select: {
            scheme_name: true,
          },
        },
        ml_states: {
          select: {
            state_name: true,
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
      return null
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
        id:true,
        type_of_issue: true,
        start_distance_km: true,
        start_distance_metre: true,
        end_distance_km: true,
        end_distance_metre: true,
        startlatitude: true,
        startlongitude: true,
        endlatitude: true,
        endlongitude: true,
        type_of_work_ucc_type_of_work_location_type_of_workTotype_of_work: {  // Correct relation field
          select: {
            name_of_work: true, // Selecting specific field from related table
          },
        },
      },
    });
    
    const groupedData = type_of_work.reduce((acc, item) => {
      const nameOfWork = item.type_of_work_ucc_type_of_work_location_type_of_workTotype_of_work.name_of_work;
  
      if (!acc[nameOfWork]) {
          acc[nameOfWork] = [];
      }
  
      acc[nameOfWork].push(item);
      return acc;
  }, {});
  
  // Convert to array format (optional)
  const type_of_work_result = Object.entries(groupedData).map(([name_of_work, items]) => ({
      name_of_work,
      data: items
  }));
  
    
    const fileRecord = await prisma.documents_master.findMany({
      where: {
        // created_by: uccRecord.created_by.toString(),
        // is_deleted: false,
        // ucc_id: id
        ucc_id: uccRecord.ucc_id
      },
      select: {
        document_id: true,
        document_path: true,
        document_name: true,
        is_deleted: true,
        document_type: true,
        module_type: true,
        module_type_id: true
      },
    });
        
    const ucc_nh_state_details_data = await prisma.ucc_nh_state_details.findMany({
      where: {
        ucc_id: uccRecord.ucc_id,
      },
      include: {
        ml_states: {   // This should match the relation name in Prisma schema
          select: {
            state_name: true,
          },
        },
      },
    });
    let ucc_nh_details_final_data = []
    for (let id of ucc_nh_state_details_data) {
      const districts = await prisma.districts_master.findMany({
        where: {
          district_id: { in: id.district_id } // No need to wrap it in another array
        },
        select: {
          district_name: true
        }
      });
      id.district_name = districts
      id.state_name = id.ml_states.state_name
      delete id.ml_states
      ucc_nh_details_final_data.push(id)
    }
    
    const ucc_nh_details_data = await prisma.ucc_nh_details.findMany({
      where: {
        ucc_id: uccRecord.ucc_id,
      },
    });
    
    const data = {
      contract_name: uccRecord.contract_name,
      short_name: uccRecord.short_name,
      implementation_mode: uccRecord.ucc_implementation_mode.mode_name,
      contract_length: uccRecord.contract_length,
      piu_details: piuDetails, // Details of each piu_id
      state: uccRecord.ml_states.state_name,
      scheme_master: uccRecord.scheme_master.scheme_name,
      or_office_master: uccRecord.or_office_master.office_name,
      type_of_work: type_of_work_result ? type_of_work_result : null,
      supporting_documents: fileRecord,
      state_and_district: ucc_nh_details_final_data,
      nation_highway: ucc_nh_details_data
    };
    return data;
  } catch (error) {
    console.error("Error fetching UCC record:", error);
    throw error
  }
};

export const getDataFromS3 = async(filePath, bucket_name) =>{
  try {
    const fileKey = filePath;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new GetObjectCommand(params);
    // const data = await s3Client.send(command);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 5000 });
    return signedUrl
  } catch (error) {
    throw err;
  }
}

export async function createFinalUCC(req, uccId) {
  try {
    logger.info("Fetching stretch ID from ucc master table based on uccID.")
    const uccMaster = await prisma.ucc_master.findUnique({
      where: { ucc_id: uccId },
      select: { stretch_id: true }
    });

    if (!uccMaster || !uccMaster.stretch_id || uccMaster.stretch_id.length === 0) {
      throw new APIError(STATUS_CODES.NOT_FOUND, "No stretch_id found for given uccId");
    }
    const stretchIds = uccMaster.stretch_id;
    logger.info("Stretch ID fetched successfully.")

    logger.info("Fetching longest stretch data.")
    const longestStretch = await prisma.$queryRaw`
        SELECT "PhaseCode", "CorridorCode", "StretchCode", "StretchID", "ProjectName"
        FROM "nhai_gis"."Stretches"
        WHERE "StretchID" = ANY(${stretchIds})
        ORDER BY public.ST_Length(geom) DESC
        LIMIT 1
    `;

    if (longestStretch.length === 0) {
      throw new APIError(STATUS_CODES.NOT_FOUND, "No valid stretches found");
    }
    logger.info("Longest stretch data fetched successfully.")

    const { PhaseCode, CorridorCode, StretchCode, StretchID, ProjectName } = longestStretch[0];

    logger.info("Fetching ucc nh state details to get state code.")
    const nhState = await prisma.ucc_nh_state_details.findFirst({
      where: { ucc_id: uccId },
      orderBy: { nh_state_distance: STRING_CONSTANT.DESC },
      select: {
        state_id: true,
        ml_states: { select: { state_code: true } }
      }
    });

    const stateCode = nhState?.ml_states?.state_code || STRING_CONSTANT.STRING_XX;
    logger.info("State code fetched successfully.")

    const balanceForAwardStatusID = await fetchStatusId(STRING_CONSTANT.BALANCE_FOR_AWARD);
    const draftStatusID = await fetchStatusId(STRING_CONSTANT.DRAFT);
    const userId = req.user?.user_id || null;
    const currentTimestamp = new Date();
    const packageCode = await generatePackageCode(StretchID);
    const permanentUCC = `N/${PhaseCode}${CorridorCode}/${StretchCode}${packageCode}/${stateCode}`;

    logger.info("Updating tables in a single transaction.");
    await prisma.$transaction(async (prisma) => {
      await prisma.package_master.create({
        data: {
          package_code: packageCode,
          stretch_code: StretchID,
          created_by: userId,
          created_at: currentTimestamp,
          update_by: userId,
          updated_at: currentTimestamp
        }
      });

      await prisma.ucc_master.update({
        where: { ucc_id: uccId },
        data: {
          status: STRING_CONSTANT.BALANCE_FOR_AWARD,
          phase_code_id: parseInt(PhaseCode),
          corridor_code_id: parseInt(CorridorCode),
          permanent_ucc: permanentUCC,
          id: permanentUCC,
          stretch_name: ProjectName
        },
      });

      await prisma.ucc_type_of_work_location.updateMany({
        where: { ucc: uccId, status: draftStatusID },
        data: { status: balanceForAwardStatusID },
      });

      await prisma.documents_master.updateMany({
        where: { 
          module_type_id: parseInt(uccId),
          module_type: STRING_CONSTANT.UCC, 
          status: STRING_CONSTANT.DRAFT 
        },
        data: { status: STRING_CONSTANT.BALANCE_FOR_AWARD },
      });

      await prisma.ucc_nh_details.updateMany({
        where: { ucc_id: uccId },
        data: { status: STRING_CONSTANT.BALANCE_FOR_AWARD },
      });

      // Handle ucc_user_mappings inside the same transaction
      const existingMapping = await prisma.ucc_user_mappings.findFirst({
        where: { ucc_id: permanentUCC, user_id: userId },
      });

      if (existingMapping) {
        await prisma.ucc_user_mappings.updateMany({
          where: { ucc_id: permanentUCC, user_id: userId },
          data: {
            status: STRING_CONSTANT.BALANCE_FOR_AWARD,
            updated_by: userId.toString(),
            updated_at: currentTimestamp,
          },
        });
      } else {
        await prisma.ucc_user_mappings.create({
          data: {
            ucc_id: permanentUCC,
            user_id: userId,
            status: STRING_CONSTANT.BALANCE_FOR_AWARD,
            created_by: userId.toString(),
            created_at: currentTimestamp,
            updated_by: userId.toString(),
            updated_at: currentTimestamp,
          },
        });
      }
    });

    logger.info("All updates completed successfully.");
    return { message: "Status updated successfully", permanentUCC };

  } catch (error) {
    logger.error({
      message: error.message,
      error: error,
      url: req.url,
      method: req.method,
      time: new Date().toISOString(),
    });
    if (error.code === "P2025") {
      throw new APIError(STATUS_CODES.NOT_FOUND, "No records found for the given uccId");
    }

    throw error;
  }
}

export async function fetchStatusId(status) {
  try {
    const balanceForAwardStatus = await prisma.status_master.findFirst({
      where: { status: status },
      select: { id: true }
    });

    if (!balanceForAwardStatus) {
      throw new APIError(STATUS_CODES.NOT_FOUND, `Status '${status}' not found in status_master`);
    }

    return balanceForAwardStatus.id;
  } catch (error) {
    throw error;
  }
}

async function generatePackageCode(stretchCode) {
  try {
    const existingPackages = await prisma.package_master.findMany({
      where: { stretch_code: stretchCode },
      select: { package_code: true },
      orderBy: { package_code: STRING_CONSTANT.DESC }
    });

    let nextPackageCode = "001";

    if (existingPackages.length > 0) {
      const lastPackageCode = parseInt(existingPackages[0].package_code, 10);
      if (lastPackageCode >= 999) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.SUCCESS.EXHAUST_PACKAGE_CODE);
      }
      nextPackageCode = String(lastPackageCode + 1).padStart(3, "0");
    }

    return nextPackageCode;
  } catch (error) {
    throw error;
  }
}