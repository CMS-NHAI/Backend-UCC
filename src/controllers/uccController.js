import { STATUS_CODES } from '../constants/statusCodeConstants.js'
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import  logger  from "../utils/logger.js";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Method : 
 * Params :
 * Description
*/

export const getUcc = async (req, res) => {

  try {

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.ANALYTICSFETCHED,
      data: "Pass Data",
    })

  } catch (error) {
    logger.error({
      message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
      error: error,
      url: req.url,
      method: req.method,
      time: new Date().toISOString(),
    })
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message })
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