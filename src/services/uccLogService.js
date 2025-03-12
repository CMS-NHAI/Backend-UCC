import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";

export const addUccLogService = async (userId, ucc_id, changed_field, new_value) => {

    if (!userId) {
        throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND);
    }
    const result = await prisma.ucc_change_log.create({
        data: {
            ucc_id: ucc_id,
            changed_field: changed_field,
            new_value: new_value,
            changed_by: userId,
            changed_at: new Date(),
            is_deleted: false,
            created_by: userId,
            created_at: new Date(),
            updated_by: userId,
            updated_at: new Date()
        }
    });

    return result;

}

export const getUccLogService = async (req, userId, page, pageSize, feature_module) => {

    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const totalCount = await uccLogCount(userId, feature_module);
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = page > totalPages ? totalPages : page;

    const whereCondition = {
        updated_by: userId,
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
            feature_module: true,
            user_master: {
                select: {
                    user_id: true, // Assuming `user_id` is in `user_master`
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


