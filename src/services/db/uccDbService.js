// const User = require('../../models/userModel');

import { RESPONSE_MESSAGES } from "../../constants/responseMessages.js";
import { STATUS_CODES } from "../../constants/statusCodeConstants.js";
import { STRING_CONSTANT } from "../../constants/stringConstant.js";
import APIError from "../../utils/apiError.js";
import { prisma } from "../../config/prismaClient.js";

export const saveNHdetailsData = async (nhDetailsArray,nhStateDetailsArray,uccId,userId) => {
  try{
    await prisma.$transaction([
      ...nhDetailsArray.map(nhDetail =>
        prisma.ucc_nh_details.create({
          data: {
            nh_number: nhDetail.nhNumber,
            start_chainage: nhDetail.startChainage,
            end_chainage: nhDetail.endChainage,
            length: nhDetail.length,
            status: STRING_CONSTANT.DRAFT,
            ucc_id: uccId,
            created_by: userId,
            created_at: new Date(),
          }
        })
      ),
      ...nhStateDetailsArray.map(nhStateDetail =>
        prisma.ucc_nh_state_details.create({
          data: {
            state_id: nhStateDetail.stateId,
            district_id: nhStateDetail.districtId,
            nh_state_distance: nhStateDetail.stateDistance,
            ucc_id: uccId,
            created_by: userId,
            created_at: new Date(),
          }
        })
      )
    ]);
  }catch(error){
    console.log(error,"error");
    throw new APIError(STATUS_CODES.BAD_REQUEST,RESPONSE_MESSAGES.ERROR.NH_DETAILS_INSERTION_FAILED)
  }
};

export const updateNHdetailsData = async (nhDetailsArray, nhStateDetailsArray, userId) => {
  try {
    await prisma.$transaction([
      ...nhDetailsArray.map(nhDetail =>
        prisma.ucc_nh_details.update({
          where: { id: nhDetail.id },
          data: {
            nh_number: nhDetail.nhNumber,
            start_chainage: nhDetail.startChainage,
            end_chainage: nhDetail.endChainage,
            length: nhDetail.length,
            updated_by: userId,
            updated_at: new Date(),
          }
        })
      ),
      ...nhStateDetailsArray.map(nhStateDetail =>
        prisma.ucc_nh_state_details.update({
          where: { id: nhStateDetail.id },
          data: {
            state_id: nhStateDetail.stateId,
            district_id: nhStateDetail.districtId,
            nh_state_distance: nhStateDetail.stateDistance,
            updated_by: userId,
            updated_at: new Date(),
          }
        })
      )
    ]);
  } catch (error) {
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.NH_DETAILS_UPDATE_FAILED);
  }
};

export const updateApprovalData =async(userId,uccId,status) =>{
  try{
    const uccData = await prisma.ucc_master.findFirst({
      where:{
        ucc_id:uccId,
      }
    })
    if(!uccData){
      throw new APIError(STATUS_CODES.NOT_FOUND,RESPONSE_MESSAGES.ERROR.NO_UCC_FOUND)
    }
    await prisma.ucc_master.update({
      where:{
        ucc_id:uccId,
      },
      data:{
        approvedby:userId,
        approvedate:new Date(),
        statusafterapproval:STRING_CONSTANT[status.toUpperCase()] || STRING_CONSTANT.REJECTED
      }
    })

  }catch(err){
    console.log(err,"eroror")
    throw new APIError(STATUS_CODES.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.NH_DETAILS_UPDATE_FAILED);
  }
}
