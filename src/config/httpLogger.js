const config = require('./config');
const logger = require('./logger');

const getIpFormat = (request) => (config.env === 'production' ? `${request.ip} - ` : '');

const getResponseTime = (reply) => reply.elapsedTime.toFixed(3);

const successResponseFormat = (request, reply) =>
  `${getIpFormat(request)}${request.method} ${request.url} ${reply.statusCode} - ${getResponseTime(reply)} ms`;

const errorResponseFormat = (request, reply) =>
  `${getIpFormat(request)}${request.method} ${request.url} ${reply.statusCode} - ${getResponseTime(reply)} ms - message: ${
    reply.errorMessage || ''
  }`;

const successHandler = (request, reply, done) => {
  if (reply.statusCode < 400) {
    logger.info(successResponseFormat(request, reply));
  }
  done();
};

const errorHandler = (request, reply, done) => {
  if (reply.statusCode >= 400) {
    logger.error(errorResponseFormat(request, reply));
  }
  done();
};

module.exports = {
  successHandler,
  errorHandler,
};
