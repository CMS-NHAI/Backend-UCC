import multer from "multer";
import path from "path";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const storage = multer.memoryStorage(); // Store file in memory (use diskStorage if needed)

const kmlFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === ".kml" || file.mimetype === "application/vnd.google-earth.kml+xml") {
    cb(null, true); // Accept the file
  } else {
    cb(new Error(RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE), false); // Reject file
  }
};

export const upload = multer({ storage,limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
}, fileFilter: kmlFilter });
