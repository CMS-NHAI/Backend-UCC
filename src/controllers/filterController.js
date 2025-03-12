import { prisma } from '../config/prismaClient.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';

export const getFilterData = async (req, res) => {
    try {
        const { piu, work_type, ro, program, phase, scheme, corridor, page = 1, limit = 10, sortBy = "name", order = "asc" } = req.query;

        let filters = {};

        const distinctValues = await prisma.UCCSegments.findMany({
            distinct: ['RO'], // Replace with your column name
            select: {
              RO: true, // Ensure you select only the distinct column
            },
          });
          
          console.log(distinctValues);


    }catch(error){

    }

}