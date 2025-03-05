import { Prisma } from "@prisma/client";
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

/**
 * Fetches the stretches data associated with a user based on the user's ID.
 * 
 * This function retrieves all UCC IDs associated with the provided user ID. Then, it fetches 
 * all stretch IDs related to those UCC IDs. Finally, it retrieves the stretch details from the 
 * database, including geometries and lengths.
 * 
 * @param {Object} req - The request object, which contains the user information.
 * @param {string} userId - The user ID used to fetch associated UCC IDs and their corresponding stretch data.
 * 
 * @throws {APIError} Throws an error if the user ID is missing, no UCC IDs are found, or no stretch data is found.
 * 
 * @returns {Array} Returns an array of stretch data objects.
 */
export async function getUserStretches(req, userId) {
    try {
        logger.info("Started processing getUserStretches.");
        if (!userId) {
            throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.USER_ID_MISSING);
        }

        logger.info("Fetching all UCC IDs associated with the user.");
        // Fetch all UCC IDs associated with the user
        const userMappings = await prisma.ucc_user_mappings.findMany({
            where: {
                user_id: Number(userId),
            },
            select: {
                ucc_id: true,
            },
        });

        if (userMappings.length === 0) {
            throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_UCC_FOUND);
        }
        logger.info("UCC ids fetched successfully.");
        const uccIds = userMappings.map(mapping => mapping.ucc_id);

        logger.info("Fetching all stretch IDs associated with the UCC IDs.");
        // Fetch all stretchIds based on UCC IDs
        const uccSegments = await prisma.uCCSegments.findMany({
            where: {
                UCC: { in: uccIds },
            },
            select: {
                StretchID: true,
            },
        });

        const stretchIds = uccSegments.map(segment => segment.StretchID);

        if (stretchIds.length === 0) {
            throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_STRETCH_FOUND);
        }
        logger.info("Stretch IDs fetched successfully.")

        logger.info("Fetching stretches data.");
        // Fetch the stretches data based on the stretchIds
        const stretches = await prisma.$queryRaw`
        SELECT
            id,
            public.ST_AsGeoJSON(geom) AS geojson,
            public.ST_Length(geom::public.geography) / 1000 AS length_km,
            "PhaseCode",
            "CorridorCode",
            "StretchCode",
            "NH",
            "ProgramName",
            "ProjectName",
            "Phase",
            "Scheme",
            "StretchID",
            "CorridorID"
          FROM "nhai_gis"."Stretches"
          WHERE "StretchID" IN (${Prisma.join(stretchIds)})
        `;

        logger.info("Stretches data fetched successfully.")
        return stretches.map((item) => {
            return {
                ...item,
                geojson: JSON.parse(item.geojson)
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}
