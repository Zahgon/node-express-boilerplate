const fastifyPassport = require('@fastify/passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const verifyCallback = (request, resolve, reject, requiredRights) => async (req, reply, err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  request.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && request.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

const auth =
  (...requiredRights) =>
  async (request, reply) => {
    return new Promise((resolve, reject) => {
      fastifyPassport
        .authenticate(
          'jwt',
          { session: false },
          verifyCallback(request, resolve, reject, requiredRights)
        )(request, reply)
        .catch(reject);
    });
  };

module.exports = auth;
