
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { prisma } from '../config/prismaClient.js';
import logger from "../utils/logger.js";

export const getProgram = async (req, res) => {
    try {
        const programData = await prisma.program_master.findMany({
            orderBy: {
                created_at: 'desc',
              },
        });

        if (!programData || programData.length === 0) {
            return res.status(STATUS_CODES.OK).json({
                success: false,
                status: STATUS_CODES.OK,
                message: 'No program records found',
                data: []
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            status: STATUS_CODES.OK,
            message: 'Program records retrieved successfully',
            data: programData
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
