import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import {
    getBlackSpotInsertData,
    getSegmentInsertData,
} from "../utils/uccUtil.js";
import { ALLOWED_TYPES_OF_WORK } from "../constants/stringConstant.js";

export const updateContractDetailService = async (req) => {

    const { shortName, piu, implementationId, schemeId, contractName, roId, stateId, contractLength } = req.body;
    const userId = req.user?.user_id;
    const ucc_id = req.body?.ucc_id
    if (!ucc_id) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
    }

    const existingContract = await prisma.ucc_master.findFirst({
        where: {
            ucc_id: ucc_id,
        },
    });

    if (!existingContract) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.CONTRACT_NOT_FOUND);
    }

    const result = await prisma.ucc_master.update({
        where: {
            ucc_id: ucc_id,
        },
        data: {
            short_name: shortName,
            piu_id: piu,
            implementation_mode_id: implementationId,
            scheme_id: schemeId,
            updated_by: userId,
            project_name: contractName,
            ro_id: roId,
            state_id: stateId,
            contract_length: contractLength,
        },
    });
    return result;

}

export async function updateTypeOfWorkService(req, userId, reqBody) {
    try {
        const dataToInsert = [];

        for (const [typeOfWork, workData] of Object.entries(reqBody)) {

            if (!ALLOWED_TYPES_OF_WORK.includes(typeOfWork)) {
                throw new APIError(
                    STATUS_CODES.BAD_REQUEST,
                    `Invalid typeOfWork: ${typeOfWork}`
                );
            }

            const typeOfWorkRecord = await prisma.type_of_work.findFirst({
                where: {
                    ID: req.body?.id,
                },
            });

            if (!typeOfWorkRecord) {
                throw new APIError(
                    STATUS_CODES.NOT_FOUND,
                    `type_of_work ${typeOfWork} not found in database`
                );
            }
            const typeOfWorkId = typeOfWorkRecord.ID;

            if (Array.isArray(workData)) {

                workData.forEach((item) => {
                    if (item.typeOfForm === "segment") {
                        const segmentData = getSegmentInsertData(
                            item,
                            typeOfWorkId,
                            userId
                        );
                        dataToInsert.push(segmentData);
                    } else if (item.typeOfForm === "blackSpot") {
                        const blackSpotData = getBlackSpotInsertData(
                            item,
                            typeOfWorkId,
                            userId
                        );

                        dataToInsert.push(blackSpotData);
                    }
                });
            }
        }

        const result = await prisma.ucc_type_of_work_location.updateMany({
            where: {
                id:req.body.id
            }

        }, {
            data: dataToInsert,
        });

        return result;
    } catch (err) {
        throw err;
    }
}

