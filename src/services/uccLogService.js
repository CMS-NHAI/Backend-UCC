import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";

export const addUccLogService = async (userId, ucc_id, data) => {
    if (!userId) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
    }

    // Ensure 'data' is an array and not empty
    if (!Array.isArray(data) || data.length === 0) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, "No data provided.");
    }

    // Prepare an array of log entries to be inserted
    const logEntries = data.map(change => ({
        ucc_id: ucc_id,
        changed_field: change.changed_field,
        new_value: change.new_value,
        changed_by: userId,
        changed_at: new Date(),
        is_deleted: false,
        created_by: userId,
        created_at: new Date(),
        updated_by: userId,
        updated_at: new Date(),
        feature_module:change.feature_module
    }));

    const result = await prisma.ucc_change_log.createMany({
        data: logEntries
    });

    return result;
};


export const getUccLogService = async (req, userId, ucc_id, page, pageSize, feature_module) => {

    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const totalCount = await uccLogCount(userId, feature_module);
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = page > totalPages ? totalPages : page;

    const whereCondition = {
        updated_by: userId,
        ucc_id: ucc_id,
        ...(feature_module ? { feature_module: feature_module } : {}),
    };

    const data = await prisma.ucc_change_log.findMany({
        where: whereCondition,
        select: {
            log_id: true,
            ucc_id: true,
            changed_field: true,
            new_value: true,
            changed_at: true,
            created_at: true,
            updated_by: true,
            updated_at: true,
            feature_module: true,
            user_master: {
                select: {
                    user_id: true,
                    name: true,
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    email: true,
                    mobile_number: true
                }
            }
        },
        skip: skip,
        take: take,
        orderBy: {
            created_at: 'desc',
        }
    });

    if (data.length === 0) {
        return {
            success: STATUS_CODES.SUCCESS,
            status: STATUS_CODES.OK,
            message: RESPONSE_MESSAGES.ERROR.UCC_LOG_NOT_FOUND,
            data: [],
            pagination: {
                page: currentPage,
                pageSize,
                totalCount,
                totalPages,
            },
        };
    }

    return {
        success: true,
        status: STATUS_CODES.OK,
        message: RESPONSE_MESSAGES.SUCCESS.UCC_LOG_LIST,
        data: data,
        pagination: {
            page: currentPage,
            pageSize,
            totalCount,
            totalPages,
        }
    };
}

async function uccLogCount(userId, feature_module) {
    return await prisma.ucc_change_log.count({
        where: {
            created_by: userId,
            feature_module: feature_module,
        }
    });
}


