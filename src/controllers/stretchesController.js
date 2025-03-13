/**
 * @author Deepak
 */

import { Readable } from "stream";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import { errorResponse } from "../helpers/errorHelper.js";
import { exportMystretchesData, fetchRequiredStretchData, getStretchDetails, getUserStretches, myStretchExportData } from "../services/stretchService.js";
import logger from "../utils/logger.js";
import { HEADER_CONSTANTS } from "../constants/headerConstant.js";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { exportToCSV } from "../utils/exportUtil.js";

/**
 * Controller to handle the request for required stretch data.
 * This function retrieves stretch data based on the provided UCC ID and chainage coordinates from the query parameters.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @throws {Error} If there is an error while fetching the required stretch data or during any other part of the process.
 * 
 * @returns {Promise<void>} The function sends a JSON response with the success status and stretch data, or an error response.
 */
export async function getRequiredStretch(req, res) {
    try {
        logger.info("UCC Controller :: getRequiredStretch");
        const { startChainagesLat, startChainagesLong, endChainagesLat, endChainagesLong } = req.query;
        const uccId = req.params.uccId

        const data = await fetchRequiredStretchData(uccId, JSON.parse(startChainagesLat), JSON.parse(startChainagesLong), JSON.parse(endChainagesLat), JSON.parse(endChainagesLong));

        res.status(STATUS_CODES.OK).json({
            success: true,
            data
        });
    } catch (error) {
        await errorResponse(req, res, error);
    }
}

/**
 * Fetch stretches data for a given user by streaming it in chunks to the client.
 * 
 * This function first retrieves the user ID from the request, then fetch the stretches data 
 * associated with the user. The data is streamed as a JSON response.
 * 
 * The response format is structured as:
 * 
 * {
 *   "success": true,
 *   "data": [ ... ] // Array of stretch data
 * }
 * 
 * @param {Object} req - The request object, containing user information.
 * @param {Object} res - The response object used to send the streamed data to the client.
 * @throws {Error} Will throw an error if there's an issue with retrieving or streaming the data.
 * 
 * @returns The function streams the data directly to the response, without returning any value.
 */
export async function fetchMyStretches(req, res) {
    try {
        logger.info("UCC Controller :: getUserStretches");
        const userId = req.user?.user_id;
        const reqBody = req.body;
        const page = parseInt(reqBody.page) || 1;
        const pageSize = parseInt(reqBody.pageSize) || 10;
        const { projectType, exports } = reqBody;

        if (exports == STRING_CONSTANT.TRUE) {
            if (projectType.toUpperCase() === STRING_CONSTANT.NHAI) {
               return await exportMystretchesData(userId, res);
            } else if(projectType.toUpperCase() === STRING_CONSTANT.MORTH) {
                return res.status(STATUS_CODES.OK).send();
            } else {
                return await exportMystretchesData(userId, res);
            }
        }
        const response = await getUserStretches(req, userId, page, pageSize, projectType);
        const readable = new Readable({
            read() {
                this.push('{ "success": true, "data": [');

                // Stream the data in chunks
                let first = true;
                const message = response.message;
                response.data.forEach((item) => {
                    if (first) {
                        first = false;
                    } else {
                        this.push(',');
                    }
                    this.push(JSON.stringify(item));
                });

                this.push('], "pagination": ');
                this.push(JSON.stringify(response.pagination));
                if(message) {
                    this.push(`,"message": "${message}"`);
                }
                this.push('}');
                this.push(null);
            }
        });

        res.setHeader(HEADER_CONSTANTS.CONTENT_TYPE, HEADER_CONSTANTS.APPLICATION_JSON);
        res.setHeader(HEADER_CONSTANTS.TRANSFER_ENCODING, HEADER_CONSTANTS.CHUNKED);

        // Pipe the data as a stream to the response
        readable.pipe(res);
    } catch (error) {
        await errorResponse(req, res, error);
    }
}

/**
 * Fetches the details of a stretch based on its StretchID and returns the data to the client.
 *
 * This function handles the API request to fetch the stretch details. It retrieves the stretch
 * data using the `getStretchDetails` function, which includes geographical data, corridor names,
 * phase information, and associated PIU/RO data. If an error occurs, it returns an appropriate response.
 *
 * @param {Object} req - The request object containing the stretch ID in the parameters.
 * @param {Object} res - The response object used to send back the stretch details or error response.
 * @throws {APIError} - If an error occurs while fetching the stretch details, it will be passed to the error handler.
 */
export async function fetchStretchDetails(req, res) {
    try {
        const stretchId = req.params?.stretchId;
        const data = await getStretchDetails(req, stretchId);
        res.status(STATUS_CODES.OK).json({
            success: true,
            data
        });
    } catch (error) {
        await errorResponse(req, res, error);
    }
}
