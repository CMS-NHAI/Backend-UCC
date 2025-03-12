import { HEADER_CONSTANTS } from '../constants/headerConstant.js';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import APIError from '../utils/apiError.js';
import { prisma } from '../config/prismaClient.js';
import logger from "../utils/logger.js";
import { getFileFromS3, insertTypeOfWork,uploadFileService, deleteFileService, getAllImplementationModes, uploadMultipleFileService,getcontractListService,basicDetailsOnReviewPage } from '../services/uccService.js';
import { STATUS } from '../constants/appConstants.js';
// import uccService from '../services/uccService.js';

/**
 * Method : 
 * Params :
 * Description
*/

// const s3Client = new S3Client({
//     region: process.env.AWS_REGION ,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
//     }
// });

export const getUcc = async (req, res) => {

  try {

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.ANALYTICSFETCHED,
      data: "Pass Data",
    })

  } catch (error) {
    await errorResponse(req, res);
  }
};

export const getTypeOfWork = async (req, res) => {
  try {
    const typeOfWork = await prisma.type_of_work.findMany({
      select: {
        ID: true,
        name_of_work: true
      },
      orderBy: {
        ID: 'asc'
      }
    });

    // If no records found
    if (!typeOfWork || typeOfWork.length === 0) {
      return res.status(STATUS_CODES.OK).json({
        success: false,
        status: STATUS_CODES.OK,
        message: 'No type of work records found',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'Type of work records retrieved successfully',
      data: typeOfWork
    });

  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error',
      data: []
    });
  }
};

export const uploadFile = async (req, res) => {
  try {
    const savedFile = await uploadFileService(req, res);

    res.status(STATUS_CODES.OK).json({
      status: true,
      message: RESPONSE_MESSAGES.SUCCESS.FILE_UPLOADED,
      data: savedFile,
    });
  } catch (error) {
    return await errorResponse(req, res,error);
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.body;
    const deletedFile = await deleteFileService(id);
    if (deletedFile?.alreadyDeleted) {
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.SUCCESS.FILE_ALREADY_DELETED,
      });
    }
    return res.status(STATUS_CODES.OK).json({
      status: true,
      message: RESPONSE_MESSAGES.SUCCESS.FILE_DELETED,
      data: deletedFile
    });
  } catch (error) {
    return await errorResponse(req, res, error);
  }
};

export const getSchemes = async (req, res) => {
  try {
    const schemes = await prisma.scheme_master.findMany({
      select: {
        scheme_id: true,
        scheme_name: true,
        is_active: true


      },
      orderBy: {
        scheme_name: 'asc'
      }
    });

    // If no records found
    if (!schemes || schemes.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        status: STATUS_CODES.NOT_FOUND,
        message: 'No Scheme records found',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'Scheme records retrieved successfully',
      data: { schemes }
    });

  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error',
      data: []
    });
  }
};


export const getRos = async (req, res) => {
  try {
    const ros = await prisma.or_office_master.findMany({
      select: {
        office_id: true,
        office_name: true,
        office_type:true,
        address_line1:true,
        address_line2:true,
        city:true,
        state:true,
        postal_code:true,
        contact_number:true,
        email:true,
        is_active: true
      },
      where: { office_type: "RO" },
      orderBy: {
        office_name: 'asc'
      }
    });

    // If no records found
    if (!ros || ros.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        status: STATUS_CODES.NOT_FOUND,
        message: 'No RO records found',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'RO records retrieved successfully',
      data: { ros }
    });

  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error',
      data: []
    });
  }
};

export const getPIUByROId = async (req, res) => {
  try {
     const { ROId } = req.query;
    if (!ROId) {
      return res.status(400).json({ success: false, status: STATUS_CODES.NOT_FOUND,message: "RO ID is required" });
    }  
    const pius = await prisma.or_office_master.findMany({
      select: {
        office_id: true,
        office_name: true,
        office_type:true,
        address_line1:true,
        address_line2:true,
        city:true,
        state:true,
        postal_code:true,
        contact_number:true,
        email:true,
        is_active: true
      },
      where: { parent_id: Number(ROId)},
      orderBy: {
        office_name: 'asc'
      }
    });

    // If no records found
    if (!pius || pius.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        status: STATUS_CODES.NOT_FOUND,
        message: 'No PIU records found',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'PIU records retrieved successfully',
      data: { pius }
    });

  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error',
      data: []
    });
  }
};
export const getStates = async (req, res) => {
  try {
    const states = await prisma.ml_states.findMany({
      select: {
        state_id: true,
        state_name: true
      },
      orderBy: {
        state_name: 'asc'
      }
    });

    // If no records found
    if (!states || states.length === 0) {
      return res.status(STATUS_CODES.OK).json({
        success: false,
        status: STATUS_CODES.OK,
        message: 'No State records found',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'State records retrieved successfully',
      data: { states }
    });

  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error',
      data: []
    });
  }
};

export const getDistrict = async (req, res) => {
  try {
    const { stateId } = req.query;
    if (!stateId) {
      return res.status(400).json({ error: "State ID is required" });
    }

    const districts = await prisma.districts_master.findMany({
      select: {
        district_id: true,
        district_name: true,
        //is_active:true
      },
      where: { state_id: Number(stateId) },
    });

    if (!districts || districts.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        status: STATUS_CODES.NOT_FOUND,
        message: 'No district records found for this state',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'District records retrieved successfully',
      data: { districts }
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export const insertTypeOfWorkController = async (req, res) => {
  try {
    logger.info("UccController :: method: insertTypeOfWorkController");
    const userId = req.user?.user_id;
    const reqBody = req.body;
    const data = await insertTypeOfWork(req, userId, reqBody);

    res.status(STATUS_CODES.CREATED).json({
      status: true,
      data
    });
  } catch (error) {
    return await errorResponse(req, res, error);
  }
}

/**
 * This function fetches the file based on the user ID, sets appropriate headers, 
 * and pipes the file stream to the response.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @throws {APIError} - Throws an error if the file could not be retrieved or some other issue occurs.
 */
export const getFile = async (req, res) => {
  try {
    logger.info("UccController :: method: getFile.");
    const userId = req.user?.user_id;
    const response = await getFileFromS3(req, userId);
    res.setHeader(HEADER_CONSTANTS.CONTENT_TYPE, HEADER_CONSTANTS.KML_CONTENT_TYPE);
    res.setHeader(HEADER_CONSTANTS.CONTENT_DISPOSITION, `attachment; filename="${response.fileName}"`);
    response.data.pipe(res);
  } catch (error) {
    return await errorResponse(req, res, error);
  }
};

export const getImplementationModes = async (req,res, next) => {
    try {
        const modes = await getAllImplementationModes();
        res.status(STATUS_CODES.OK).json({
          status: true,
          message: "",
          data: modes,
        }); 
    } catch (error) {
    return await errorResponse(req, res, error);
    }
};

export const getuserUccDetails = async (req, res) => {
  try {
    
   const data = await getcontractListService(req, res);

   if(!data){
    return;
   }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: RESPONSE_MESSAGES.SUCCESS.CONTRACT_DETAILS_FETCHED,
      data,
    });

  } catch (error) {
    return errorResponse(req, res, error);
  }
}

export const getBasicDetailsOfReviewPage = async (req,res, next) => {
  try {
    const ucc_id = parseInt(req.query.ucc_id)
    if(!ucc_id){
      res.status(STATUS_CODES.BAD_REQUEST).json({
        status: false,
        message: "Please provide the ucc id",
        data: null,
      }); 
    }
      const basicDetails = await basicDetailsOnReviewPage(ucc_id);
      res.status(STATUS_CODES.OK).json({
        status: true,
        message: "",
        data: basicDetails,
      }); 
  } catch (error) {
  return await errorResponse(req, res, error);
  }
};