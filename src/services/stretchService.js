import { Prisma } from "@prisma/client";
import { prisma } from "../config/prismaClient.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";
import APIError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { getPhaseNameBeforeParentheses } from "../utils/uccUtil.js";

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
 * Counts the number of stretches for the given stretch IDs.
 * 
 * @param {Array<number>} stretchIds - The array of stretch IDs to count.
 * @returns {Promise<number>} - The count of stretches for the provided stretch IDs.
 */
async function nhaiStretchCount(stretchIds) {
    return await prisma.Stretches.count({
        where: {
            StretchID: { in: stretchIds }
        }
    });
}

/**
 * Fetches the details of NHAI stretches with pagination and data aggregation.
 *
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of items to fetch per page.
 * @param {Array<number>} stretchIds - The array of stretch IDs to fetch details for.
 * @returns {Promise<Object>} - An object containing the stretches data and pagination details.
 */
async function nhaiStretchDetails(page, pageSize, stretchIds) {
    const totalCount = await nhaiStretchCount(stretchIds);
    const totalPages = Math.ceil(totalCount / pageSize);
    // If the current page is greater than the total pages, adjusting it
    const currentPage = page > totalPages ? totalPages : page;

    const stretches = await prisma.$queryRaw`
            SELECT 
                s.id,
                public.ST_AsGeoJSON(s.geom) AS geojson,
                public.ST_Length(s.geom::public.geography) / 1000 AS length_km,
                s."PhaseCode",
                -- s."CorridorCode",
                -- s."StretchCode",
                s."NH",
                s."ProgramName",
                s."ProjectName",
                s."Phase",
                s."Scheme",
                s."StretchID",
                s."CorridorID",
                array_agg(DISTINCT c."CorridorName") AS corridor_names,
                array_agg(DISTINCT ppm."description") AS phases
            FROM 
                "nhai_gis"."Stretches" s
            LEFT JOIN 
                "nhai_gis"."Corridors" c ON s."CorridorID" = c."CorridorID"
            LEFT JOIN 
                "tenant_nhai"."project_phase_master" ppm ON LPAD(s."PhaseCode", 2, '0') = LPAD(ppm."phase_code", 2, '0')
            WHERE 
                s."StretchID" IN (${Prisma.join(stretchIds)})
            GROUP BY 
                s.id, s.geom, s."PhaseCode", s."CorridorCode", s."StretchCode", s."NH", s."ProgramName", s."ProjectName",
                s."Phase", s."Scheme", s."StretchID", s."CorridorID"
            LIMIT ${pageSize} OFFSET ${(currentPage - 1) * pageSize}
        `;


    logger.info("Stretches data fetched successfully. ");
    const data = stretches.map((item) => {
        const uniquePhases = Array.from(new Set(item.phases.map(getPhaseNameBeforeParentheses)));

        return {
            ...item,
            geojson: JSON.parse(item.geojson),
            phases: uniquePhases,
        }
    });

    return {
        data,
        pagination: {
            page: currentPage,
            pageSize,
            totalCount,
            totalPages,
        }
    }
}

/**
 * Fetches the count of MORTHs.
 *
 * @param {Array<number>} stretchIds - The array of morth IDs to count.
 * @returns {Promise<number>} - The count of MORTHs.
 */
async function morthCount(morthIds) {
    return 0;
}

/**
 * Fetches the details of MORTHs with pagination and data aggregation.
 *
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of items to fetch per page.
 * @param {Array<number>} stretchIds - The array of stretch IDs to fetch details for.
 * @returns {Promise<Object>} - An object containing the stretches data and pagination details.
 */
async function morthProjectDetails(page, pageSize, stretchIds) {
    const data = [];
    const totalCount = await morthCount(stretchIds);
    const totalPages = Math.ceil(totalCount / pageSize);
    // If the current page is greater than the total pages, adjusting it
    const currentPage = page > totalPages ? totalPages : page;

    return {
        data,
        pagination: {
            page: 0,
            pageSize,
            totalCount,
            totalPages,
        }
    }
}

/**
 * Combines NHAI and MORTH project data based on the project type with pagination.
 *
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of items to fetch per page.
 * @param {Array<number>} stretchIds - The array of stretch IDs to fetch details for.
 * @returns {Promise<Object>} - An object containing the combined stretches data and pagination details.
 */
async function combinedProjectDetails(page, pageSize, stretchIds) {
    const stretchData = await nhaiStretchDetails(page, pageSize, stretchIds);
    const morthData = await morthProjectDetails(page, pageSize, stretchIds);
    const totalCount = await morthCount(stretchIds) + await nhaiStretchCount(stretchIds);
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = page > totalPages ? totalPages : page;

    return {
        data: [...stretchData.data, ...morthData.data],
        pagination: {
            page: currentPage,
            pageSize,
            totalCount,
            totalPages,
        }
    }

}

/**
 * Fetches project details based on the project type (NHAI, MORTH, or ALL) with pagination.
 *
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of items to fetch per page.
 * @param {string} projectType - The project type, one of "NHAI", "MORTH", or "ALL".
 * @param {Array<number>} stretchIds - The array of stretch IDs to fetch details for.
 * @returns {Promise<Object>} - An object containing the stretches data and pagination details for the specified project type.
 */
async function projectDetails(page, pageSize, projectType, stretchIds) {
    switch (projectType.toLowerCase()) {
        case STRING_CONSTANT.NHAI.toLowerCase():
            return await nhaiStretchDetails(page, pageSize, stretchIds);
        case STRING_CONSTANT.MORTH.toLowerCase():
            return await morthProjectDetails(page, pageSize, stretchIds);
        case STRING_CONSTANT.ALL.toLowerCase():
            return await combinedProjectDetails(page, pageSize, stretchIds);
        default:
            throw new Error(`Invalid project type: ${projectType}`);
    }
}

/**
 * Fetches user-specific stretches data based on user ID and pagination parameters.
 * 
 * This function retrieves UCC IDs associated with the user, fetches the corresponding stretch IDs,
 * and then retrieves the stretches data with pagination. The data is filtered based on the project type (NHAI, MORTH, or ALL).
 *
 * @param {Object} req - The request object containing user information and pagination details.
 * @param {string} userId - The user ID used to fetch associated UCC IDs and their corresponding stretch data.
 * @param {number} page - The current page number for pagination.
 * @param {number} pageSize - The number of items to fetch per page.
 * @param {string} projectType - The project type (NHAI, MORTH, or ALL).
 * 
 * @throws {APIError} - If the user ID is missing, or if no UCC or stretch IDs are found.
 * 
 * @returns {Promise<Object>} - Returns the stretches data and pagination details for the specified user and project type.
 */
export async function getUserStretches(req, userId, page, pageSize, projectType) {
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

        return projectDetails(page, pageSize, projectType, stretchIds);
    } catch (error) {
        logger.error({
            message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
            error: error,
            url: req.url,
            method: req.method,
            time: new Date().toISOString(),
        });
        throw error;
    }
}

/**
 * Fetches the detailed information for a specific stretch based on its StretchID.
 *
 * This function retrieves data for a specific stretch
 *
 * @param {number} stretchId - The ID of the stretch whose details need to be fetched.
 * @returns {Promise<Array>} - Returns an array containing detailed stretch data.
 */
async function stretchDetail(stretchId) {
    return await prisma.$queryRaw`
            SELECT 
                s.id,
                public.ST_Length(s.geom::public.geography) / 1000 AS length_km,
                s."PhaseCode",
                s."NH",
                s."ProgramName",
                s."ProjectName",
                s."Phase",
                s."Scheme",
                s."StretchID",
                s."CorridorID",
                array_agg(DISTINCT c."CorridorName") AS corridor_names,
                array_agg(DISTINCT ppm."description") AS phases
            FROM 
                "nhai_gis"."Stretches" s
            LEFT JOIN 
                "nhai_gis"."Corridors" c ON s."CorridorID" = c."CorridorID"
            LEFT JOIN 
                "tenant_nhai"."project_phase_master" ppm ON LPAD(s."PhaseCode", 2, '0') = LPAD(ppm."phase_code", 2, '0')
            WHERE 
                s."StretchID" = ${stretchId}
            GROUP BY 
                s.id, s.geom, s."PhaseCode", s."CorridorCode", s."StretchCode", s."NH", s."ProgramName", s."ProjectName",
                s."Phase", s."Scheme", s."StretchID", s."CorridorID"
        `;
}

/**
 * Fetches the stretch details along with the PIU (Project Implementation Unit) and RO (Region Office) details.
 *
 * This function calls `stretchDetail` to fetch the basic stretch details, and then retrieves PIU and RO
 * information associated with the stretch ID from the `UCCSegments` table. The final response includes
 * the stretch's data, corridor names, phases, and PIU and RO values.
 *
 * @param {Object} req - The request object containing information about the API request.
 * @param {number} stretchId - The ID of the stretch for which details are required.
 * @returns {Promise<Object>} - Returns the detailed stretch data including the PIU and RO information.
 * @throws {APIError} - Throws an error if no stretch data is found or if there's an issue fetching the details.
 */
export async function getStretchDetails(req, stretchId) {
    try {
        logger.info("Fetching stretch detail associated with the Stretch IDs.");

        const stretchDetails = await stretchDetail(stretchId);
        if (stretchDetails.length === 0) {
            throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_STRETCH_FOUND_FOR_ID);
        }
        const stretchData = stretchDetails[0];

        logger.info("Fetching Stretches PIU and RO details.");
        const uccSegments = await prisma.UCCSegments.findMany({
            where: {
                StretchID: stretchId,
            },
            select: {
                StretchID: true,
                PIU: true,
                RO: true,
                UCC: true,
            },
        });;

        if (uccSegments.length === 0) {
            throw new APIError(STATUS_CODES.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NO_STRETCH_FOUND_FOR_ID);
        }
        logger.info("Stretche PIU and RO details fetched successfully.");

        const stretchPiuRos = { piu: [], ro: [] };

        uccSegments.forEach((segment) => {
            const ro = segment.RO;
            stretchPiuRos.piu.push(segment.PIU); // Append the segment.PIU value
            stretchPiuRos.ro.push(ro ? ro.split(STRING_CONSTANT.RO)[1] : ro); // Split and append to the ro array
        });

        stretchData.piu = stretchPiuRos.piu.join();
        stretchData.ro = stretchPiuRos.ro.join();
        return stretchData;
    } catch (error) {
        logger.error({
            message: RESPONSE_MESSAGES.ERROR.REQUEST_PROCESSING_ERROR,
            error: error,
            url: req.url,
            method: req.method,
            time: new Date().toISOString(),
        });
        throw error;
    }
}
