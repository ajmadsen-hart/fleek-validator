var validate        = require('./one');
var ValidationError = require('./error');
var helpers         = require('./../helpers');
var _               = require('lodash');

//
// Context Validate
//
// Paramters
//  ctx
//    [Object] - Koa request context
//
//  parameters
//    [Array] - set of parameter objects to validate agains
//
// Returns:
//   [Array] - array of errors
//     OR
//   [Boolean] - true if validation passed
//
module.exports = function (ctx, parameters) {
  var request = (ctx ||{}).request || {};
  var errors  = [];

  if (!(_.isObject(request) && _.isArray(parameters))) {
    throw new Error('Validate expects a valid request context and array of parameters');
  }

  _.each(parameters, function (parameter) {
    var src = null;

    switch (parameter.in) {
      case 'query' : src = request.query || {}; break;
      case 'body'  : src = request.body || {}; break;
      case 'path'  : src = (ctx || {}).params || {}; break;
      case 'header': src = request.headers || {}; break;
      // case 'formData': src = request.formData; break;
    }

    if (!_.isObject(src)) {
      throw new Error('Parameter source [' + parameter.in + '] is not supported');
    }

    // body needs to be handled differently
    if (parameter.in !== 'body') {
      src = src[parameter.name];
    }

    var result = validate(src, parameter, { defaults: true });
    if (result !== undefined) {
      if (helpers.isValidationError(result)) {
        errors.push(result);
      } else {
        if (parameter.in !== 'body') {
          src[parameter.name] = result;
        } else {
          request.body = result;
        }
      }
    }
  });

  return helpers.formatResult(errors);
}
