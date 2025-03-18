import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import { saveNHdetailsData,updateNHdetailsData } from "./db/uccDbService.js";

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
        // Collect all promises for updating the segments
        const updatePromises = reqBody.typeOfWorks.map(async (work) => {
            const { id, typeofissue, endLane, startChainage, endChainage } = work;
            const updatedSegment = await prisma.ucc_type_of_work_location.update({
                where: { id: parseInt(id) },
                data: {
                    startlatitude: startChainage?.lat,
                    startlongitude: startChainage?.long,
                    endlatitude: endChainage?.lat,
                    endlongitude: endChainage?.long,
                    start_distance_km: startChainage?.kilometer,
                    start_distance_metre: startChainage?.meter,
                    end_distance_km: endChainage?.kilometer,
                    end_distance_metre: endChainage?.meter,
                    lane: endLane,
                    type_of_issue: typeofissue,
                    status: 1,
                },
            });
            return updatedSegment;
        });

        const updatedSegments = await Promise.all(updatePromises);

        return updatedSegments;

    } catch (err) {
        console.error("Error updating type of work:", err);
        throw new Error("Failed to update type of work: " + err.message);
    }
}

export const saveNHDetailsService = async (req) => {
    const userId = req.user?.user_id;
    if (!userId) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
    }
    const { nhDetails, nhStateDetails,uccId} = req.body;

    if (!Array.isArray(nhDetails) || !Array.isArray(nhStateDetails) || !nhDetails.length || !nhStateDetails.length) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_NH_DETAILS);
    }

    await saveNHdetailsData(nhDetails,nhStateDetails,uccId,userId);
}

export const updateNHdetailsService =async (userId,payload)=> {
    if (!userId) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
    }
    await updateNHdetailsData(payload.nhDetails,payload.nhStateDetails,userId)


}


