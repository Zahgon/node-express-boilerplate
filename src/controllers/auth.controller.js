const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (request, reply) => {
  const user = await userService.createUser(request.body);
  const tokens = await tokenService.generateAuthTokens(user);
  reply.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (request, reply) => {
  const { email, password } = request.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  reply.send({ user, tokens });
});

const logout = catchAsync(async (request, reply) => {
  await authService.logout(request.body.refreshToken);
  reply.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (request, reply) => {
  const tokens = await authService.refreshAuth(request.body.refreshToken);
  reply.send({ ...tokens });
});

const forgotPassword = catchAsync(async (request, reply) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(request.body.email);
  await emailService.sendResetPasswordEmail(request.body.email, resetPasswordToken);
  reply.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (request, reply) => {
  await authService.resetPassword(request.query.token, request.body.password);
  reply.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (request, reply) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(request.user);
  await emailService.sendVerificationEmail(request.user.email, verifyEmailToken);
  reply.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (request, reply) => {
  await authService.verifyEmail(request.query.token);
  reply.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
