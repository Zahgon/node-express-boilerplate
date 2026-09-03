const swaggerJsdoc = require('swagger-jsdoc');
const fastifySwagger = require('@fastify/swagger');
const fastifySwaggerUi = require('@fastify/swagger-ui');
const swaggerDefinition = require('../../docs/swaggerDef');

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/routes/v1/*.js'],
});

const router = async (fastify, options) => {
  await fastify.register(fastifySwagger, {
    mode: 'static',
    specification: {
      document: specs,
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: options.routePrefix,
  });
};

module.exports = router;
