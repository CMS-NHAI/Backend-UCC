import { prisma } from "../config/prismaClient.js";
export const uccLogService = async (userId, ucc_id , changed_field, new_value) => {

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