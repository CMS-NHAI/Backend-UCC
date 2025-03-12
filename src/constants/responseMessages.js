export const RESPONSE_MESSAGES = {
  
    ERROR: {
      USER_ID_MISSING: 'UserId is required.',
      INVALIDFILTER: 'Invalid filter provided.',
      REQUEST_PROCESSING_ERROR: "Error Occured while processing request",
      STRETCH_DATA_ERROR: "An error occurred while creating required stretch based on given start and end chainages.",
      FILE_NOT_FOUND: "File not found",
      FILE_UPLOAD_FAILED: "File upload failed",
      USER_NOT_FOUND: "User not found",
      CONTRACT_NOT_FOUND: "Contract not found",
      DOCUMENT_TYPE_NOT_FOUND : "Document type not provided",
      INVALID_FILE_TYPE:"Invalid file type. Only kml files are allowed.",
      ERROR_FILE_DOWNLOAD: "Error occurred while downloading the file from S3 bucket",
      INVALID_PDF_FILE_TYPE:"Invalid file type. Only PDF files are allowed.",
      NO_UCC_FOUND: "No UCC mappings found for the given userId",
      NO_STRETCH_FOUND: "No stretches found for the given UCCs",
      NO_STRETCH_FOUND_FOR_ID: "No stretches found for the given Stretch ID",
      DRAFT_ALREADY_EXISTS:"A draft contract already exists for this user."
    },
    SUCCESS: {
        FILE_UPLOADED: "File uploaded successfully",
        FILE_FETCHED: "File fetched successfully",
        FILE_DELETED: "File deleted successfully",
        FILE_ALREADY_DELETED:"File Already Deleted",
        CONTRACT_DETAILS_SAVED: "Contract details saved successfully",
        CONTRACT_DETAILS_FETCHED: "Contract details fetched successfully",
        CONTRACT_UPDATED: "Contract updated successfully"
    },
  }