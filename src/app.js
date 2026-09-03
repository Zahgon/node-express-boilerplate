const fastify = require('fastify');
const helmet = require('@fastify/helmet');
const formbody = require('@fastify/formbody');
const compress = require('@fastify/compress');
const cors = require('@fastify/cors');
const fastifyPassport = require('@fastify/passport');
const httpStatus = require('http-status');
const qs = require('qs');
const config = require('./config/config');
const httpLogger = require('./config/httpLogger');
const { jwtStrategy } = require('./config/passport');
const { xss, mongoSanitize } = require('./middlewares/sanitize');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = fastify({
  logger: false,
  // maximum size of the request body, as applied by the body parsers
  bodyLimit: 100 * 1024,
  routerOptions: {
    // parse the query string with the extended syntax
    querystringParser: (str) => qs.parse(str),
  },
});

// holds the message of the error that was sent back, used by the http logger
app.decorateReply('errorMessage', '');

if (config.env !== 'test') {
  app.addHook('onResponse', httpLogger.successHandler);
  app.addHook('onResponse', httpLogger.errorHandler);
}

// set security HTTP headers
app.register(helmet);

// parse json request body (handled natively by fastify)

// parse urlencoded request body
app.register(formbody, { parser: (str) => qs.parse(str) });

// sanitize request data
app.addHook('preValidation', xss);
app.addHook('preValidation', mongoSanitize);

// gzip compression
app.register(compress);

// enable cors (preflight requests are answered by the plugin itself)
app.register(cors, { strictPreflight: false });

// jwt authentication
// @fastify/passport pulls in @fastify/flash, which requires a `session` request
// decorator to be present. This app is stateless, so it is declared as null.
app.decorateRequest('session', null);
app.register(fastifyPassport.initialize());
fastifyPassport.use('jwt', jwtStrategy);

// v1 api routes
app.register(routes, { prefix: '/v1' });

// send back a 404 error for any unknown api request
app.setNotFoundHandler(() => {
  throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
});

// convert error to ApiError, if needed, and handle it
app.setErrorHandler((err, request, reply) => errorHandler(errorConverter(err), request, reply));

module.exports = app;
