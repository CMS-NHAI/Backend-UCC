export function getSegmentInsertData(segment, typeOfWork, userId) {
    const {
        startChainage,
        endChainage,
        endLane,
        typeOfForm,
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
        // ucc: 'some-unique-id',
        type_of_issue: typeOfForm,
        status: 1,
        user_id: userId
    };
}

export function getBlackSpotInsertData(blackSpot, typeOfWork, userId) {
    const {
        chainage,
        endLane,
        typeOfForm,
    } = blackSpot;

    return {
        type_of_work: typeOfWork,
        startlatitude: chainage.lat,
        startlongitude: chainage.long,
        start_distance_km: chainage.kilometer,
        start_distance_metre: chainage.meter,
        lane: endLane,
        // ucc: 'some-unique-id',
        type_of_issue: typeOfForm,
        status: 1,
        user_id: userId
    };
}
