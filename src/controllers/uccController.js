import { PrismaClient } from '@prisma/client';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import { fetchRequiredStretchData } from '../services/stretchService.js';
import  logger  from "../utils/logger.js";
import APIError from '../utils/apiError.js';
import { getFileFromS3, uploadFileService } from '../services/uccService.js';
import { HEADER_CONSTANTS } from '../constants/headerConstant.js';


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
        Name_of_Work: true
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

/**
 * Controller to handle the request for required stretch data.
 * This function retrieves stretch data based on the provided UCC ID and chainage coordinates from the query parameters.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {Error} If there is an error while fetching the required stretch data or during any other part of the process.
 * 
 * @returns {Promise<void>} The function sends a JSON response with the success status and stretch data, or an error response.
 */
export async function getRequiredStretch(req, res) {
  try {
    logger.info("UCC Controller :: getRequiredStretch");
    const { startChainagesLat, startChainagesLong, endChainagesLat, endChainagesLong } = req.query;
    const uccId = req.params.uccId

    const data = await fetchRequiredStretchData(uccId, JSON.parse(startChainagesLat), JSON.parse(startChainagesLong), JSON.parse(endChainagesLat), JSON.parse(endChainagesLong));

    res.status(STATUS_CODES.OK).json({
      success: true,
      data
    })
  } catch (error) {
    await errorResponse(req, res, error);
  }
}
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


export const getSchemes = async (req, res) => {
  try {
    const schemes = await prisma.scheme_master.findMany({
      select: {
        scheme_id: true,
        scheme_name: true,
        is_active:true

        
      },
      orderBy: {
        scheme_name: 'asc'
      }
    });

    // If no records found
    if (!schemes || schemes.length === 0) {
      return res.status(STATUS_CODES.OK).json({
        success: false,
        status: STATUS_CODES.OK,
        message: 'No Scheme records found',
        data: []
      });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      status: STATUS_CODES.OK,
      message: 'Scheme records retrieved successfully',
      data: {schemes}
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
      data: {schemes}
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
