import { HEADER_CONSTANTS } from '../constants/headerConstant.js';
import { RESPONSE_MESSAGES } from '../constants/responseMessages.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';
import { errorResponse } from '../helpers/errorHelper.js';
import APIError from '../utils/apiError.js';
import logger from "../utils/logger.js";
import { getMultipleFileFromS3, deleteMultipleFileService, uploadMultipleFileService, uploadFileService } from '../services/uccService.js';

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
 * Method : @GET
 * Description : @getSupportingDoc method use to get pdf.
 */
export const getSupportingDoc = async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            throw new APIError(STATUS_CODES.BAD_REQUEST, "User not authenticated");
        }

        const files = await getMultipleFileFromS3(req, userId);

        if (!files || files.length === 0) {
            return res.status(404).json({ message: "No files found for this user" });
        }

        for (const file of files) {
            if (file.error) {
                console.error(`Error fetching file: ${file.fileName} - ${file.error}`);
                continue;
            }

            if (file.data) {
                res.setHeader(HEADER_CONSTANTS.CONTENT_TYPE, HEADER_CONSTANTS.PDF_CONTENT_TYPE);
                res.setHeader(HEADER_CONSTANTS.CONTENT_DISPOSITION, `attachment; filename="${files.fileName}"`);
                file.data.pipe(res);
                return; // Return after sending the first file
            } else {
                return res.status(500).json({ message: `File data for ${file.fileName} is missing` });
            }
        }

    } catch (error) {
        return await errorResponse(req, res, error);
    }
};

/**
 * Method : @Delete
 * Params : @id
 * Description : @deleteSupportingDoc method use to delete the supporting document.
*/

export const deleteSupportingDoc = async (req, res) => {
    try {
        const { document_id } = req.body;
        const deletedFile = await deleteMultipleFileService(document_id);
        if (deletedFile?.alreadyDeleted) {
            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.SUCCESS.FILE_ALREADY_DELETED,
            });
        }
        return res.status(STATUS_CODES.OK).json({
            success: true,
            status:STATUS_CODES.OK,
            message: RESPONSE_MESSAGES.SUCCESS.FILE_DELETED,
            data: deletedFile
        });
    } catch (error) {
        return await errorResponse(req, res, error);
    }
};

export const uploadShapeFile = async(req, res)=>{

    try{

        const savedFile = await uploadFileService(req, res);
        
        res.status(STATUS_CODES.CREATED).json({
            success:STATUS_CODES.SUCCESS,
            status:STATUS_CODES.CREATED,
            message:RESPONSE_MESSAGES.SUCCESS.FILE_UPLOADED,
            data: savedFile
        })

    }catch(error){

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success:STATUS_CODES.FAIL,
            status:STATUS_CODES.INTERNAL_SERVER_ERROR,
            message:error.message
        })
    }

}