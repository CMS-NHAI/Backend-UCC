import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";


export async function fetchChainageData(uccId) {
    try {
        const result = await prisma.$queryRaw`
            SELECT 
                "ID",
                "UCC", 
                "ChainageID",
                "X", 
                "Y" 
            FROM nhai_gis."Chainages" 
            WHERE "UCC" = ${uccId};
        `;

         // Convert BigInt values to Numbers
         const parsedResult = result.map(row => ({
            ...row,
            ID: typeof row.ID === "bigint" ? Number(row.ID) : row.ID,
            ChainageID: typeof row.ChainageID === "bigint" ? Number(row.ChainageID) : row.ChainageID,
            X: typeof row.X === "bigint" ? Number(row.X) : row.X,
            Y: typeof row.Y === "bigint" ? Number(row.Y) : row.Y
        }));

        return {
            success: true,
            status: 200,
            data: parsedResult
        };

    } catch (error) {
        console.error("Error fetching chainage data:", error);

        return {
            success: false,
            status: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || "Internal server error"
        };
    }
}