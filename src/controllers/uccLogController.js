import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { getUccLogService } from '../services/uccLogService.js';

export const getUccLogList = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const feature_module = req.params.feature_module
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const data = await getUccLogService(req, userId, page, pageSize, feature_module)

        if (!data || data.length === 0) {
            return res.status(STATUS_CODES.OK).json({
                success: false,
                status: STATUS_CODES.OK,
                message: 'No records found',
                data: []
            });
        }

        return res.status(STATUS_CODES.OK).json(
            data
        );

    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
            data: []
        });
    }
};
