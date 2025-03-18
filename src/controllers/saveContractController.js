import {insertContractDetails } from '../services/uccService.js';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import logger from '../utils/logger.js';
import { saveNHDetailsService } from '../services/contractService.js';
/**
 * Controller to save the contract details.
 * This function saves the contract data to the database.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {Error} If there is an error while saving the contract details or during any other part of the process.
 * 
 * @returns {Promise<void>} The function sends a JSON response with the success status and contract details, or an error response.
 */
export const saveContractDetails =async(req,res)=>{
    try {
      const data = await insertContractDetails(req);
  
      res.status(STATUS_CODES.OK).json({
        status: true,
        message: RESPONSE_MESSAGES.SUCCESS.CONTRACT_DETAILS_SAVED,
        data
      });
    } catch (error) {
        console.log(error,"error")
      return await errorResponse(req, res, error);
    }
  }

  export const saveNHdetails = async (req, res) => {
 try {
      await saveNHDetailsService(req);
  
      res.status(STATUS_CODES.OK).json({
        status: true,
        message: RESPONSE_MESSAGES.SUCCESS.CONTRACT_DETAILS_SAVED,
      });
    } catch (error) {
      return await errorResponse(req, res, error);
  }
}