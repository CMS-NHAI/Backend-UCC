import { STATUS_CODES } from '../constants/statusCodeConstants.js'
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { logger } from "../utils/logger.js";

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
