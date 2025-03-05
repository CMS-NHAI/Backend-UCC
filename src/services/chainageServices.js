import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";


export async function fetchChainageData(req, uccId, reqBody) {
    try {
           const result = await prisma.$queryRaw`
            select "ID", "UCC", "ChainageID","X", "Y" from nhai_gis."Chainages" 
            WHERE "ucc"=${uccId};
        `;

        return JSON.parse(result);

    }catch(error){
        logger.error({
            message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
            error: error,
            url: req.url,
            method: req.method,
            time: new Date().toISOString(),
        });
        throw APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.STRETCH_DATA_ERROR)

}