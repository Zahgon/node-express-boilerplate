const catchAsync = (fn) => async (request, reply) => {
  // errors thrown here are forwarded to the error handler by fastify
  await fn(request, reply);
};

module.exports = catchAsync;
