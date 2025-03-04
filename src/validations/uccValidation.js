import Joi from 'joi';
import { ALLOWED_TYPES_OF_WORK } from '../constants/stringConstant.js';

const uccId = Joi.string().trim().custom((value, helpers) => {
  // If ucc_id is "all", it is valid
  if (value === 'all') {
    return value;
  }

  // Ensure ucc_id is a non-numeric string
  if (/^\d+$/.test(value)) {
    return helpers.error('string.pattern.base', { message: 'ucc_id cannot be purely numeric' });
  }

  // Validate string as alphanumeric
  const regex = /^[A-Za-z0-9]+$/;
  if (!regex.test(value)) {
    return helpers.error('string.pattern.base', { message: 'ucc_id must be alphanumeric and can include letters and numbers only' });
  }

  return value;
}).required().messages({
  'string.base': 'ucc_id must be a string',
  'string.empty': 'ucc_id cannot be an empty string',
  'any.required': 'ucc_id is required',
  'string.pattern.base': 'ucc_id must be alphanumeric and can include letters and numbers only',
});

const chainageSchema = Joi.object({
  kilometer: Joi.number().min(0).required(),
  meter: Joi.number().min(0).required(),
  lat: Joi.number().min(-90).max(90).required(),
  long: Joi.number().min(-180).max(180).required(),
});

export const uccValidationSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
});

export const getRequiredStretchQueryValidationSchema = Joi.object({
  startChainagesLat: Joi.number().required()
    .messages({
      'number.base': 'startChainagesLat must be a floating-point number.',
      'any.required': 'startChainagesLat is required.'
    }),
  startChainagesLong: Joi.number().required()
    .messages({
      'number.base': 'startChainagesLong must be a floating-point number.',
      'any.required': 'startChainagesLong is required.'
    }),

  endChainagesLat: Joi.number().required()
    .messages({
      'number.base': 'endChainagesLat must be a floating-point number.',
      'any.required': 'endChainagesLat is required.'
    }),

  endChainagesLong: Joi.number().required()
    .messages({
      'number.base': 'endChainagesLong must be a floating-point number.',
      'any.required': 'endChainagesLong is required.'
    }),
});

export const getRequiredStretchParamsValidationSchema = Joi.object({
  uccId
});

export const typeOfWorkRequestBodySchema = Joi.object().pattern(
  Joi.string().valid(...ALLOWED_TYPES_OF_WORK),  // Keys must be a valid type of work
  Joi.array().items(
    Joi.object({
      typeOfForm: Joi.string().valid('segment', 'blackSpot').required(),
      endLane: Joi.number().required(),
      startChainage: chainageSchema.when('typeOfForm', { is: 'segment', then: Joi.required() }),
      endChainage: chainageSchema.when('typeOfForm', { is: 'segment', then: Joi.required() }),
      chainage: chainageSchema.when('typeOfForm', { is: 'blackSpot', then: Joi.required() }),
    })
  )
);
