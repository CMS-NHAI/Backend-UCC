import { prisma } from '../config/prismaClient.js';
import { STATUS_CODES } from '../constants/statusCodeConstants.js';

export const getFilterData = async (req, res) => {
    try {
        const { piu, work_type, ro, program, phase, scheme, corridor, page = 1, limit = 10, sortBy = "name", order = "asc" } = req.query;

        let filters = {};

        const roList = await prisma.UCCSegments.findMany({
            distinct: ['RO'], 
            select: {
              RO: true, 
            },
          });

          const piuList = await prisma.UCCSegments.findMany({
            distinct: ['PIU'], 
            select: {
              PIU: true, 
            },
          });

          const schemesList = await prisma.scheme_master.findMany({
            select: {
              scheme_name: true,
            }
          });

          const phaseList = await prisma.project_phase_master.findMany({
            select: {
                project_phase_name: true,
              },
        });

        const programList = await prisma.program_master.findMany({
            select: {
                program_name: true,
              },
        });

        const typeOfWorkList = await prisma.type_of_work.findMany({
            select: {
              name_of_work: true
            }
          });

          const corridorsList = await prisma.UCCSegments.findMany({
            distinct: ['CorridorName'], 
            select: {
                CorridorName: true, 
            },
          });

          
          filters={...piuList, ...typeOfWorkList, ...roList}
       console.log(filters)

    }catch(error){

    }

}