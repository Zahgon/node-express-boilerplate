const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const ApiError = require('../../../src/utils/ApiError');
const config = require('../../../src/config/config');
const logger = require('../../../src/config/logger');

const createRequest = () => ({});

const createReply = () => ({
  statusCode: httpStatus.OK,
  errorMessage: '',
  status(code) {
    this.statusCode = code;
    return this;
  },
  send() {
    return this;
  },
});

describe('Error middlewares', () => {
  describe('Error converter', () => {
    test('should return the same ApiError object it was called with', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error');

      expect(errorConverter(error)).toBe(error);
    });

    test('should convert an Error to ApiError and preserve its status and message', () => {
      const error = new Error('Any error');
      error.statusCode = httpStatus.BAD_REQUEST;

      const convertedError = errorConverter(error);

      expect(convertedError).toBeInstanceOf(ApiError);
      expect(convertedError).toEqual(
        expect.objectContaining({
          statusCode: error.statusCode,
          message: error.message,
          isOperational: false,
        })
      );
    });

    test('should convert an Error without status to ApiError with status 500', () => {
      const error = new Error('Any error');

      const convertedError = errorConverter(error);

      expect(convertedError).toBeInstanceOf(ApiError);
      expect(convertedError).toEqual(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          isOperational: false,
        })
      );
    });

    test('should convert an Error without message to ApiError with default message of that http status', () => {
      const error = new Error();
      error.statusCode = httpStatus.BAD_REQUEST;

      const convertedError = errorConverter(error);

      expect(convertedError).toBeInstanceOf(ApiError);
      expect(convertedError).toEqual(
        expect.objectContaining({
          statusCode: error.statusCode,
          message: httpStatus[error.statusCode],
          isOperational: false,
        })
      );
    });

    test('should convert a Mongoose error to ApiError with status 400 and preserve its message', () => {
      const error = new mongoose.Error('Any mongoose error');

      const convertedError = errorConverter(error);

      expect(convertedError).toBeInstanceOf(ApiError);
      expect(convertedError).toEqual(
        expect.objectContaining({
          statusCode: httpStatus.BAD_REQUEST,
          message: error.message,
          isOperational: false,
        })
      );
    });

    test('should convert any other object to ApiError with status 500 and its message', () => {
      const error = {};

      const convertedError = errorConverter(error);

      expect(convertedError).toBeInstanceOf(ApiError);
      expect(convertedError).toEqual(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
          isOperational: false,
        })
      );
    });
  });

  describe('Error handler', () => {
    beforeEach(() => {
      jest.spyOn(logger, 'error').mockImplementation(() => {});
    });

    test('should send proper error response and put the error message in the reply', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const reply = createReply();
      const sendSpy = jest.spyOn(reply, 'send');

      errorHandler(error, createRequest(), reply);

      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ code: error.statusCode, message: error.message }));
      expect(reply.errorMessage).toBe(error.message);
    });

    test('should put the error stack in the response if in development mode', () => {
      config.env = 'development';
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const reply = createReply();
      const sendSpy = jest.spyOn(reply, 'send');

      errorHandler(error, createRequest(), reply);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ code: error.statusCode, message: error.message, stack: error.stack })
      );
      config.env = process.env.NODE_ENV;
    });

    test('should send internal server error status and message if in production mode and error is not operational', () => {
      config.env = 'production';
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error', false);
      const reply = createReply();
      const sendSpy = jest.spyOn(reply, 'send');

      errorHandler(error, createRequest(), reply);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
        })
      );
      expect(reply.errorMessage).toBe(error.message);
      config.env = process.env.NODE_ENV;
    });

    test('should preserve original error status and message if in production mode and error is operational', () => {
      config.env = 'production';
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const reply = createReply();
      const sendSpy = jest.spyOn(reply, 'send');

      errorHandler(error, createRequest(), reply);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: error.statusCode,
          message: error.message,
        })
      );
      config.env = process.env.NODE_ENV;
    });
  });
});
