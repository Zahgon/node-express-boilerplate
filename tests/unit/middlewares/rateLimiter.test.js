const fastify = require('fastify');
const httpStatus = require('http-status');
const { authLimiter } = require('../../../src/middlewares/rateLimiter');

const max = 20;

// the limiter counts per ip, so every test uses its own one to stay independent
const setupApp = async () => {
  const app = fastify();

  // routes the limiter is registered on
  app.register(async (instance) => {
    await instance.register(authLimiter);
    instance.post('/auth/login', async (request, reply) => reply.status(httpStatus.BAD_REQUEST).send({}));
    instance.post('/auth/register', async (request, reply) => reply.status(httpStatus.CREATED).send({}));
  });

  // routes registered outside of the scope of the limiter
  app.register(async (instance) => {
    instance.get('/users', async (request, reply) => reply.send({}));
  });

  await app.ready();
  return app;
};

const send = (app, url, ip, method = 'POST') => app.inject({ method, url, remoteAddress: ip });

describe('Rate limiter middleware', () => {
  let app;

  beforeEach(async () => {
    app = await setupApp();
  });

  afterEach(async () => {
    await app.close();
  });

  test('should let through the failed requests that are within the limit', async () => {
    const ip = '10.0.0.1';

    for (let i = 0; i < max; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await send(app, '/auth/login', ip);
      expect(res.statusCode).toBe(httpStatus.BAD_REQUEST);
    }
  });

  test('should return 429 once the maximum number of failed requests is exceeded', async () => {
    const ip = '10.0.0.2';

    for (let i = 0; i < max; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await send(app, '/auth/login', ip);
    }
    const res = await send(app, '/auth/login', ip);

    expect(res.statusCode).toBe(httpStatus.TOO_MANY_REQUESTS);
    expect(JSON.parse(res.payload).message).toBe('Too many requests, please try again later.');
  });

  test('should not count the requests that succeeded', async () => {
    const ip = '10.0.0.3';

    for (let i = 0; i < max * 2; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await send(app, '/auth/register', ip);
      expect(res.statusCode).toBe(httpStatus.CREATED);
    }
    const res = await send(app, '/auth/login', ip);

    expect(res.statusCode).toBe(httpStatus.BAD_REQUEST);
  });

  test('should count the failed requests of every ip separately', async () => {
    const ip = '10.0.0.4';
    const otherIp = '10.0.0.5';

    for (let i = 0; i < max + 1; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await send(app, '/auth/login', ip);
    }
    const res = await send(app, '/auth/login', otherIp);

    expect(res.statusCode).toBe(httpStatus.BAD_REQUEST);
  });

  test('should not rate limit the routes it is not registered on', async () => {
    const ip = '10.0.0.6';

    for (let i = 0; i < max + 1; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await send(app, '/auth/login', ip);
    }
    expect((await send(app, '/auth/login', ip)).statusCode).toBe(httpStatus.TOO_MANY_REQUESTS);

    const res = await send(app, '/users', ip, 'GET');

    expect(res.statusCode).toBe(httpStatus.OK);
  });
});
