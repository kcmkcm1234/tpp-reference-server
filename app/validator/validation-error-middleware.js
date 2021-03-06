const debug = require('debug')('debug');

const validationErrorMiddleware = (err, req, res, next) => { // eslint-disable-line
  if (err.failedValidation) {
    debug('failed validation');
    const {
      apiDeclarations,
      results,
      errors,
      failedValidation,
      originalResponse,
      warnings,
      message,
    } = err;
    res.body = {
      apiDeclarations,
      errors,
      failedValidation,
      originalResponse,
      results,
      warnings,
      message,
    };
    return res.status(400).end();
  } else if (res.statusCode !== 400) {
    debug('passed validation');
  }
  next();
};

exports.validationErrorMiddleware = validationErrorMiddleware;
