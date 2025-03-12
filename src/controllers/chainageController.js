import { prisma } from '../config/prismaClient.js';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import logger from "../utils/logger.js";
import APIError from '../utils/apiError.js';
import { HEADER_CONSTANTS } from '../constants/headerConstant.js';
import { fetchChainageData } from '../services/chainageServices.js';


export const getChainageByUcc = async (req, res) => {
    try {
        const { uccId } = req.body;
        if (!uccId) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success:false, status:STATUS_CODES.NOT_FOUND, message: "State ID is required" });
        }
        const response = await fetchChainageData(uccId);
        //const ChainageData = await fetchChainageData(res, uccId);
        console.log(response);
        return res.status(response.status).json(response);
    }catch(error){
        console.log(error)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
            data: []
          });
        //return await errorResponse(req, res, error);
    }

}