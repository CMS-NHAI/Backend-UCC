import { format } from "@fast-csv/format";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import { STATUS_CODES } from "../constants/statusCodeConstants.js";

/**
 * Converts an array of objects to a CSV stream and sends it as a response.
 * @param {Object} res - Express response object.
 * @param {Array} data - Array of objects to be converted to CSV.
 * @param {Array} headers - Array of header objects [{ id: "id", title: "ID" }, ...].
 * @param {string} filename - Name of the downloaded file.
 */
export const exportToCSV = async (res, data,filename="users", headers = null) => {
    try {
        if (!data || data.length === 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({ message: RESPONSE_MESSAGES.ERROR.EXPORT_DATA_NOT_FOUND });
        }

        if (!headers) {
            headers = Object.keys(data[0]).map(key => ({
                id: key,
                title: key.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase()), // e.g., user_name -> User Name
            }));
        }

        Promise.all[await res.setHeader("Content-Type", "text/csv"),
        await res.setHeader("Content-Disposition", `attachment; filename=${filename}.csv`)];

        const csvStream = format({ headers: headers.map(h => h.title) });

        csvStream.pipe(res);

        data.forEach(item => {
            const row = {};
            headers.forEach(header => {
                row[header.title] = item[header.id];
            });
            csvStream.write(row);
        });

        csvStream.end();
    } catch(error) {
        console.log(error, "error")
    }
};