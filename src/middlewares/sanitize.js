const { inHTMLData } = require('xss-filters');
const mongoSanitizer = require('express-mongo-sanitize');

/**
 * Escape the html entities of every value of the given request data
 * @param {*} data
 * @returns {*}
 */
const clean = (data = '') => {
  let isObject = false;
  let value = data;
  if (typeof value === 'object') {
    value = JSON.stringify(value);
    isObject = true;
  }

  value = inHTMLData(value).trim();
  if (isObject) value = JSON.parse(value);

  return value;
};

/**
 * Sanitize the request data against xss
 */
const xss = (request, reply, done) => {
  if (request.body) request.body = clean(request.body);
  if (request.query) request.query = clean(request.query);
  if (request.params) request.params = clean(request.params);

  done();
};

/**
 * Sanitize the request data against query injection
 */
const mongoSanitize = (request, reply, done) => {
  // the keys holding a prohibited character are dropped from the target itself
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (request[key]) {
      mongoSanitizer.sanitize(request[key], {});
    }
  });

  done();
};

module.exports = {
  xss,
  mongoSanitize,
};
