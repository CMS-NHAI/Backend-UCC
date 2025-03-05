export const RESPONSE_MESSAGES = {
  
    ERROR: {
      USER_ID_MISSING: 'UserId is required.',
      INVALIDFILTER: 'Invalid filter provided.',
      REQUEST_PROCESSING_ERROR: "Error Occured while processing request",
      STRETCH_DATA_ERROR: "An error occurred while creating required stretch based on given start and end chainages.",
      FILE_NOT_FOUND: "File not found",
      FILE_UPLOAD_FAILED: "File upload failed",
      USER_NOT_FOUND: "User not found",
      DOCUMENT_TYPE_NOT_FOUND : "Document type not provided",
      INVALID_FILE_TYPE:"Invalid file type. Only kml files are allowed.",
      ERROR_FILE_DOWNLOAD: "Error occurred while downloading the file from S3 bucket",
      INVALID_PDF_FILE_TYPE:"Invalid file type. Only PDF files are allowed."
    },
    SUCCESS: {
        FILE_UPLOADED: "File uploaded successfully",
        FILE_FETCHED: "File fetched successfully",
        FILE_DELETED: "File deleted successfully",
        FILE_ALREADY_DELETED:"File Already Deleted"
    },
  }