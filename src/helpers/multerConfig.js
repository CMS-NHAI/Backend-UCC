import multer from "multer";
import path from "path";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const storage = multer.memoryStorage();

const kmlFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === ".kml" || path.extname(file.originalname).toLowerCase() === ".zip" || path.extname(file.originalname).toLowerCase() === ".shx" || path.extname(file.originalname).toLowerCase() === ".shp" || path.extname(file.originalname).toLowerCase() === ".qmd" || path.extname(file.originalname).toLowerCase() === ".prj" || path.extname(file.originalname).toLowerCase() === ".dbf" || path.extname(file.originalname).toLowerCase() === ".cpg") {
    cb(null, true);
  } else {
    cb(new Error(RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE), false);
  }
};

const supprotingDocPdf = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error(RESPONSE_MESSAGES.ERROR.INVALID_PDF_FILE_TYPE), false);
  }
};

export const upload = multer({
  storage, limits: {
    fileSize: 5 * 1024 * 1024
  }, fileFilter: kmlFilter
});

export const ValidateSupportingPDF = multer({
  storage, limits: {
    fileSize: 5 * 1024 * 1024
  }, fileFilter: supprotingDocPdf
});
