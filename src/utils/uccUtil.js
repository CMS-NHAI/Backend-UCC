/**
 * @author Deepak
 */
import { STRING_CONSTANT } from "../constants/stringConstant.js";

export function getSegmentInsertData(segment, typeOfWork, userId, typeOfIssue, uccId) {
    const {
        startChainage,
        endChainage,
        endLane,
    } = segment;
    return {
        type_of_work: typeOfWork,
        startlatitude: startChainage.lat,
        startlongitude: startChainage.long,
        endlatitude: endChainage.lat,
        endlongitude: endChainage.long,
        start_distance_km: startChainage.kilometer,
        start_distance_metre: startChainage.meter,
        end_distance_km: endChainage.kilometer,
        end_distance_metre: endChainage.meter,
        lane: endLane,
        ucc: uccId ? uccId : null,
        type_of_issue: typeOfIssue,
        status: 1,
        user_id: userId
    };
}

export function getBlackSpotInsertData(blackSpot, typeOfWork, userId, typeOfIssue, uccId) {
    const {
        chainage,
        endLane,
    } = blackSpot;

    return {
        type_of_work: typeOfWork,
        startlatitude: chainage.lat,
        startlongitude: chainage.long,
        start_distance_km: chainage.kilometer,
        start_distance_metre: chainage.meter,
        lane: endLane,
        ucc: uccId ? uccId : null,
        type_of_issue: typeOfIssue,
        status: 1,
        user_id: userId
    };
}

/**
 * Extracts the phase name before any parentheses from the given phase string.
 *
 * This function uses a regular expression to find everything before any parentheses in a phase name, and returns the cleaned-up string.
 * If there are no parentheses, the entire phase name is returned. It also trims any leading or trailing spaces.
 *
 * @param {string} phase - The phase name string which may contain parentheses.
 * @returns {string} - The portion of the phase name before any parentheses, or the entire phase name if no parentheses are present.
 */
export function getPhaseNameBeforeParentheses(phase) {
    const match = phase.match(/^(.*?)(\s*\(.*\))?$/); // Capture everything before the parentheses (if they exist)
    return match ? match[1].trim() : phase;
}

export function calculateSegmentLength(startChainage, endChainage) {
    const kmDifference = endChainage.kilometer - startChainage.kilometer;
    const meterDifference = endChainage.meter - startChainage.meter;
    return kmDifference + meterDifference / 1000;  // Convert meters to kilometers
}

/**
 * Generates a SQL WHERE clause for filtering stretches based on provided request parameters.
 * 
 * This function dynamically constructs a SQL condition string based on filters such as 
 * corridor, program, phase, scheme, RO, and PIU. It ensures that only stretches matching 
 * the given criteria are selected.
 * 
 * @param {Object} req - The HTTP request object containing filter parameters in `req.body`.
 * @param {string[]} stretchIds - An array of StretchIDs to filter results.
 * @returns {string} - A dynamically generated SQL WHERE clause for filtering stretches.
 */
export function getMyStretchesFilterConditions(req, stretchIds) {
    const { corridor, program, phase, scheme, ro, piu } = req.body;
    const stringStretchIds = stretchIds.map(id => `'${id}'`).join(STRING_CONSTANT.COMMA);
    // Construct WHERE conditions dynamically based on the filters
    let whereConditions = `s."StretchID" IN (${stringStretchIds})`;

    if (corridor && corridor.length > 0) {
        whereConditions += ` AND c."CorridorName" IN (${corridor.map(crd => `'${crd}'`).join(STRING_CONSTANT.COMMA)})`;
    }
    if (program && program.length > 0) {
        whereConditions += ` AND s."ProgramName" IN (${program.map(program => `'${program}'`).join(STRING_CONSTANT.COMMA)})`;
    }
    if (phase && phase.length > 0) {
        whereConditions += ` AND s."Phase" IN (${phase.map(phase => `'${phase}'`).join(STRING_CONSTANT.COMMA)})`;
    }
    if (scheme && scheme.length > 0) {
        whereConditions += ` AND s."Scheme" IN (${scheme.map(scheme => `'${scheme}'`).join(STRING_CONSTANT.COMMA)})`;
    }
    if (ro && ro.length > 0) {
        whereConditions += ` AND ucc."RO" IN (${ro.map(ro => `'${ro}'`).join(STRING_CONSTANT.COMMA)})`;
    }
    if (piu && piu.length > 0) {
        whereConditions += ` AND ucc."PIU" IN (${piu.map(piu => `'${piu}'`).join(STRING_CONSTANT.COMMA)})`;
    }

    return whereConditions;
}