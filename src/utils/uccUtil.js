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