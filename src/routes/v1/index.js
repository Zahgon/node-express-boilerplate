const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

const router = async (fastify) => {
  defaultRoutes.forEach((route) => {
    fastify.register(route.route, { prefix: route.path });
  });

  /* istanbul ignore next */
  if (config.env === 'development') {
    devRoutes.forEach((route) => {
      // the swagger ui plugin mounts its own routes, so it is given the path
      fastify.register(route.route, { routePrefix: route.path });
    });
  }
};

module.exports = router;
