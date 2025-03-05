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

    }

}