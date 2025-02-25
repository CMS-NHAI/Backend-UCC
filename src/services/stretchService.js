import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";

/**
 * Fetches the required stretch data by querying a GIS database and splitting a stretch line based on the provided chainages.
 * The function calculates a segment of the line defined by the start and end chainages (latitude and longitude).
 *
 * @param {string} uccId - The unique identifier for the UCC (Unique Constract Code).
 * @param {number} startChainagesLat - The latitude of the starting chainage point.
 * @param {number} startChainagesLong - The longitude of the starting chainage point.
 * @param {number} endChainagesLat - The latitude of the ending chainage point.
 * @param {number} endChainagesLong - The longitude of the ending chainage point.
 * 
 * @returns {Promise<Array<number[]>>} A promise that resolves to an array of coordinates representing the segment geometry in GeoJSON format.
 * 
 * @throws {APIError} If there's an error in querying or processing the stretch data, an APIError is thrown with an appropriate error message and status code.
 */
export async function fetchRequiredStretchData(uccId, startChainagesLat, startChainagesLong, endChainagesLat, endChainagesLong) {
    try {
        logger.info("Started splitting the stretch line based on given chainages.")
        const result = await prisma.$queryRaw`
            SELECT 
            public.ST_AsGeoJSON(
                public.ST_LineSubstring(
                    (public.ST_Dump(wkb_geometry)).geom,  -- Unnest MultiLineString to individual LineStrings
                    public.ST_LineLocatePoint((public.ST_Dump(wkb_geometry)).geom, public.ST_SetSRID(public.ST_Point(${startChainagesLat}, ${startChainagesLong}), 4326)),
                    public.ST_LineLocatePoint((public.ST_Dump(wkb_geometry)).geom, public.ST_SetSRID(public.ST_Point(${endChainagesLat}, ${endChainagesLong}), 4326))
                )
            ) as segment_geojson
            FROM nhai_gis.nhaicenterlines
            WHERE "ucc"=${uccId};
        `;

        logger.info("Stretch splitted successfully returning data.")
        return JSON.parse(result[0].segment_geojson).coordinates;
    } catch (error) {
        logger.error({
            message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
            error: error,
            url: req.url,
            method: req.method,
            time: new Date().toISOString(),
        });
        throw APIError(STATUS_CODES.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.STRETCH_DATA_ERROR)
    }
}