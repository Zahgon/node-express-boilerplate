const fp = require('fastify-plugin');
const fastifyRateLimit = require('@fastify/rate-limit');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const windowMs = 15 * 60 * 1000;
const max = 20;

/**
 * In memory fixed window counter: every key is counted within the same window,
 * and the whole window is reset at once.
 */
const createCounter = (timeWindow) => {
  let hits = {};
  let resetTime = Date.now() + timeWindow;

  const resetAll = () => {
    hits = {};
    resetTime = Date.now() + timeWindow;
  };

  const interval = setInterval(resetAll, timeWindow);
  /* istanbul ignore else */
  if (interval.unref) {
    interval.unref();
  }

  return {
    incr: (key) => {
      hits[key] = (hits[key] || 0) + 1;
      return { current: hits[key], ttl: resetTime - Date.now() };
    },
    decrement: (key) => {
      if (hits[key]) {
        hits[key] -= 1;
      }
    },
  };
};

const counter = createCounter(windowMs);

/**
 * Store handed over to @fastify/rate-limit. Every child shares the same counter,
 * as a single window is used for all the rate limited routes.
 */
class Store {
  // eslint-disable-next-line class-methods-use-this
  incr(key, cb) {
    cb(null, counter.incr(key));
  }

  child() {
    return this;
  }
}

const authLimiter = fp(async (fastify) => {
  await fastify.register(fastifyRateLimit, {
    max,
    timeWindow: windowMs,
    store: Store,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests, please try again later.'),
  });

  // do not count the requests that succeeded (skipSuccessfulRequests)
  fastify.addHook('onResponse', (request, reply, done) => {
    if (reply.statusCode < 400) {
      counter.decrement(request.ip);
    }
    done();
  });
});

module.exports = {
  authLimiter,
};
