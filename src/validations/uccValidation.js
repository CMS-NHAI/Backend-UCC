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

export const typeOfWorkRequestBodySchema = Joi.object()
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
;

export const saveContractDetailsSchema = Joi.object({
  shortName: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      "string.base": "Short name must be a string.",
      "string.empty": "Short name is required.",
      "any.required": "Short name is required."
    }),

  piu: Joi.array()
    .items(Joi.number().positive().required().messages({
      "number.base": "PIU ID must be a number.",
      "number.positive": "PIU ID must be a positive number.",
      "any.required": "Each PIU ID is required."
    }))
    .min(1)
    .required()
    .messages({
      "array.base": "PIU must be an array.",
      "array.min": "At least one PIU ID is required.",
      "any.required": "PIU is required."
    }),

  implementationId: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "Implementation ID must be a number.",
      "number.positive": "Implementation ID must be a positive number.",
      "any.required": "Implementation ID is required."
    }),

  schemeId: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "Scheme ID must be a number.",
      "number.positive": "Scheme ID must be a positive number.",
      "any.required": "Scheme ID is required."
    }),

  contractName: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      "string.base": "Contract name must be a string.",
      "string.empty": "Contract name is required.",
      "any.required": "Contract name is required."
    }),

  roId: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "RO ID must be a number.",
      "number.positive": "RO ID must be a positive number.",
      "any.required": "RO ID is required."
    }),

  stateId: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "State ID must be a number.",
      "number.positive": "State ID must be a positive number.",
      "any.required": "State ID is required."
    }),
    contractLength: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "Contract Length must be a number.",
      "number.positive": "Contract Length must be a positive number.",
      "any.required": "Contract Length is required."
    }),
    uccId: Joi.number()
    .positive()
    .required({
      "number.base": "uccId must be a number.",
      "number.positive": "uccId must be a positive number.",
      "any.required": "uccId is required."
    }

    )
});

export const contractValidationSchema = Joi.object({
  stretchIds: Joi.array()
      .required()
      .messages({
          'any.required': 'stretchIds is required',
          'array.base': 'stretchIds must be an array',
      }),
  
  piu: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  ro: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  program: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  phase: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  typeOfWork: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  scheme: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  corridor: Joi.array().items(Joi.string().trim()).optional(), // Optional array of strings
  limit: Joi.number().integer().positive().optional(), // Optional positive integer
  page: Joi.number().integer().positive().optional(), // Optional positive integer
  exports: Joi.boolean().optional(), // Optional string with value 'true'
  search: Joi.string().allow("").optional(), // Optional string
});

export const deleteFileValidationSchema = Joi.object({
  id: Joi.number().integer().positive().required().strict().prefs({ convert: false }).messages({
    "number.base": "ID must be a number.",
    "number.positive": "ID must be a positive number.",
    "any.required": "ID is required."
  }),
});

export const nhDetailsSchema = Joi.object({
  uccId:Joi.number().integer().positive().required().messages({ 'any.required': 'UCC ID is required' }),
  nhDetails: Joi.array().items(
    Joi.object({
      nhNumber: Joi.string().required().messages({ 'any.required': 'NH Number is required' }),
      startChainage: Joi.number().min(0).required().messages({ 'any.required': 'Start Chainage is required' }),
      endChainage: Joi.number().min(Joi.ref('startChainage')).required().messages({ 'any.required': 'End Chainage is required' }),
      length: Joi.number().positive().required().messages({ 'any.required': 'Length is required' }),
    })
  ).min(1).required().messages({ 'array.min': 'At least one NH detail is required' }),

  nhStateDetails: Joi.array().items(
    Joi.object({
      stateId: Joi.number().integer().positive().required().messages({ 'any.required': 'State ID is required' }),
      districtId: Joi.number().integer().positive().required().messages({ 'any.required': 'District ID is required' }),
      stateDistance: Joi.number().positive().required().messages({ 'any.required': 'State Distance is required' }),
    })
  ).min(1).required().messages({ 'array.min': 'At least one NH state detail is required' }),
});

