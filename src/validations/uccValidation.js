import Joi from 'joi';

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