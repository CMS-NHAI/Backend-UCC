/**
 * @author Deepak
 */

import { Readable } from "stream";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import { errorResponse } from "../helpers/errorHelper.js";
import { fetchRequiredStretchData, getUserStretches } from "../services/stretchService.js";
import logger from "../utils/logger.js";
import { HEADER_CONSTANTS } from "../constants/headerConstant.js";

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
        })
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
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const projectType = req.query.projectType;

        const response = await getUserStretches(req, userId, page, pageSize, projectType);

        const readable = new Readable({
            read() {
                this.push('{ "success": true, "data": [');

                // Stream the data in chunks
                let first = true;
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
