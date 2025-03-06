import { HEADER_CONSTANTS } from '../constants/headerConstant.js';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import APIError from '../utils/apiError.js';
import logger from "../utils/logger.js";
import { getFileFromS3, deleteFileService, uploadMultipleFileService } from '../services/uccService.js';
// import uccService from '../services/uccService.js';


/**
 * Method : POST
 * Description : Upload supporting document
 * Params : files
*/
export const uploadSupportingDocument = async (req, res) => {
    try {

        const savedFiles = await uploadMultipleFileService(req, res);

        return res.status(STATUS_CODES.OK).json({
            success: true,
            status: STATUS_CODES.OK,
            message: RESPONSE_MESSAGES.SUCCESS.FILE_UPLOADED,
            data: savedFiles,
        });

    } catch (error) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, status: STATUS_CODES.INTERNAL_SERVER_ERROR, message: error.message })
    }
};

/**
 * This function fetches the file based on the user ID, sets appropriate headers, 
 * and pipes the file stream to the response.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * 
 * @throws {APIError} - Throws an error if the file could not be retrieved or some other issue occurs.
 */
export const getSupportingDoc = async (req, res) => {
    try {
        res.send("testing =======>>>>>>")
        const userId = req.user?.user_id;
        const response = await getFileFromS3(req, userId);
        res.setHeader(HEADER_CONSTANTS.CONTENT_TYPE, HEADER_CONSTANTS.KML_CONTENT_TYPE);
        res.setHeader(HEADER_CONSTANTS.CONTENT_DISPOSITION, `attachment; filename="${response.fileName}"`);
        response.data.pipe(res);
    } catch (error) {
        return await errorResponse(req, res, error);
    }
};

/**
 * Method : Delete
 * Params : 
 * Description : 
*/

export const deleteSupportingDoc = async (req, res) => {
    try {
        const { id } = req.body;
        const deletedFile = await deleteFileService(id);
        if (deletedFile?.alreadyDeleted) {
            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.SUCCESS.FILE_ALREADY_DELETED,
            });
        }
        return res.status(STATUS_CODES.OK).json({
            status: true,
            message: RESPONSE_MESSAGES.SUCCESS.FILE_DELETED,
            data: deletedFile
        });
    } catch (error) {
        return await errorResponse(req, res, error);
    }
};