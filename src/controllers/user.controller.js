const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const createUser = catchAsync(async (request, reply) => {
  const user = await userService.createUser(request.body);
  reply.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (request, reply) => {
  const filter = pick(request.query, ['name', 'role']);
  const options = pick(request.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  reply.send(result);
});

const getUser = catchAsync(async (request, reply) => {
  const user = await userService.getUserById(request.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  reply.send(user);
});

const updateUser = catchAsync(async (request, reply) => {
  const user = await userService.updateUserById(request.params.userId, request.body);
  reply.send(user);
});

const deleteUser = catchAsync(async (request, reply) => {
  await userService.deleteUserById(request.params.userId);
  reply.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
