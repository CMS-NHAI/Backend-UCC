import { prisma } from "../config/prismaClient.js";
export const addUccLogService = async (userId, ucc_id , changed_field, new_value) => {

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
    // Calculate pagination values
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const totalCount = await uccLogCount(userId, feature_module);
    const totalPages = Math.ceil(totalCount / pageSize);
    // If the current page is greater than the total pages, adjusting it
    const currentPage = page > totalPages ? totalPages : page;

    const uccLogData = await prisma.ucc_change_log.findMany({
        where: {
            created_by: userId,
            feature_module: feature_module,
        },
        skip: skip,
        take: take,
        orderBy: {
            created_at: 'desc',
        },
    });

    if (uccLogData.length === 0) {
        throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_UCC_FOUND);
    }

    return  {
        uccLogData,
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


