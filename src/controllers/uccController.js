import { PrismaClient } from '@prisma/client';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import { fetchRequiredStretchData } from '../services/stretchService.js';
import logger from '../utils/logger.js';
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
