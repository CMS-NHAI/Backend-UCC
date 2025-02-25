export const RESPONSE_MESSAGES = {
  
    ERROR: {
      USER_ID_MISSING: 'UserId is required.',
      INVALIDFILTER: 'Invalid filter provided.',
      REQUEST_PROCESSING_ERROR: "Error Occured while processing request",
      STRETCH_DATA_ERROR: "An error occurred while creating required stretch based on given start and end chainages."
    },
    SUCCESS: {
        ANALYTICSFETCHED: 'Attendance analytics fetched successfully.',
        NO_TEAM_MEMBERS: "No team members found to fetch data.",
        NO_UCC_FOUND: "No UCCs found in the database for the given user.",
        OUTSIDE_WORK_AREA: "You are out of your work area",
        INSIDE_WORK_AREA: "You are within your work area",
        ATTENDANCE_RECORDS_FETCHED_SUCCESSFULLY:'Attendance Count fetched Successfully',
        NO_UCC_FOR_USERID: "No UCC found for the given user's userID."
    },
  }