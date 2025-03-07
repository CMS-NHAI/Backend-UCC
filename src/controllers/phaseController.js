
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { prisma } from '../config/prismaClient.js';
import logger from "../utils/logger.js";

export const getPhase = async (req, res) => {
    try {
        const phaseData = await prisma.project_phase_master.findMany({
            orderBy: {
                created_at: 'desc',
              },
        });

        if (!phaseData || phaseData.length === 0) {
            return res.status(STATUS_CODES.OK).json({
                success: false,
                status: STATUS_CODES.OK,
                message: 'No phase records found',
                data: []
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            status: STATUS_CODES.OK,
            message: 'Phase records retrieved successfully',
            data: phaseData
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
