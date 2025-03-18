import { prisma } from '../config/prismaClient.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';

export const getFilterData = async (req, res) => {
    try {
        //const { piu, work_type, roList, program, phase, scheme, corridor, page = 1, limit = 10, sortBy = "name", order = "asc" } = req.query;

        

        const ro = await prisma.UCCSegments.findMany({
            distinct: ['RO'], 
            select: {
              RO: true, 
            },
          });

          const piu = await prisma.UCCSegments.findMany({
            distinct: ['PIU'], 
            select: {
              PIU: true, 
            },
          });

          const schemes = await prisma.scheme_master.findMany({
            select: {
              scheme_name: true,
            }
          });

          const phase = await prisma.project_phase_master.findMany({
            select: {
                project_phase_name: true,
              },
        });

        const program = await prisma.program_master.findMany({
            select: {
                program_name: true,
              },
        });

        const work_type = await prisma.type_of_work.findMany({
            select: {
              name_of_work: true
            }
          });

        //   const corridorList = await prisma.Corridors.findMany({
        //     //distinct: ['CorridorName'], 
        //     select: {
        //         CorridorName: true, 
        //     },
        //   });
        const corridor = await prisma.$queryRaw`
  SELECT DISTINCT "CorridorName" FROM "nhai_gis"."Corridors"
`;

        //   const corridorsList = await prisma.Corridors.findMany({
        //     distinct: ['CorridorName'], 
        //     select: {
        //         CorridorName: true, 
        //     },
        //   });

          
          const filterData = {
            piu,
            work_type,
            ro,
            program,
            phase,
            schemes,
            corridor 
          }
          return res.status(STATUS_CODES.OK).json({
            success: true,
            status: STATUS_CODES.OK,
            message: 'All filter records retrieved successfully',
            data: filterData
        });

    }catch(error){
        console.log(error)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error',
            data: []
        });

    }

}