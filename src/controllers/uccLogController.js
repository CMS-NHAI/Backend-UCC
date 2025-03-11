import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { prisma } from '../config/prismaClient.js';

export const getUccLogList = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const uccLogData = await prisma.ucc_change_log.findMany({
            where: {
                created_by: userId,

            },
        });
        // If no records found
        if (!uccLogData || uccLogData.length === 0) {
            return res.status(STATUS_CODES.OK).json({
                success: false,
                status: STATUS_CODES.OK,
                message: 'No records found',
                data: []
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            status: STATUS_CODES.OK,
            message: 'Ucc log records retrieved successfully',
            data: uccLogData
        });

    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
            data: []
        });
    }
};
