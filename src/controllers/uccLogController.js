import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { getUccLogService } from '../services/uccLogService.js';
import { addUccLogService } from '../services/uccLogService.js';

/**
 * Method : GET
 * Description : @getUccLogList method use to get log list
*/
export const addUccLog = async (req, res) => {
    try {

        const userId = req.user?.user_id;
        const { ucc_id, data } = req.body

        const outputdata = await addUccLogService(userId, ucc_id , data)

        if (!outputdata || outputdata.length === 0) {
            return res.status(STATUS_CODES.OK).json({
                success: false,
                status: STATUS_CODES.OK,
                message: 'No records found',
                data: []
            });
        }

        return res.status(STATUS_CODES.OK).json({ success:true, status:STATUS_CODES.OK, message:"Ucc Log created successfully."});

    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
            data: []
        });
    }
};

/**
 * Method : GET
 * Description : @getUccLogList method use to get log list
*/
export const getUccLogList = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const feature_module = req.query.feature_module
        const ucc_id = req.query.ucc_id
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const data = await getUccLogService(req, userId, ucc_id, page, pageSize, feature_module)

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



