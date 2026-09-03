const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const validate = (schema) => async (request) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(request, Object.keys(validSchema));
  // fastify leaves the body undefined when the request has none, while the
  // schemas are written against an always present (possibly empty) object
  if ('body' in validSchema && object.body === undefined) {
    object.body = {};
  }
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
  }
  Object.assign(request, value);
};

module.exports = validate;
