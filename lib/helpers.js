var _      = require('lodash');
var router = require('koa-router');
var co     = require('co');

//
// Path to absolute
//
// normalize both relative and absolute paths to be absolue (relative start with `.`)
//
// Parameters:
//   basePath
//     [String] - base path to resolve relative paths
//
//   initPath
//     [String] - path to build to, abolute or relative
//
//
exports.pathToAbsolute = function (basePath, initPath) {
  if (!(_.isString(basePath) && _.isString(initPath))) { throw new Error('pathtoAbsolute requires both basePath and initPath to be strings'); }

  var result = null;

  // relative
  if (~initPath.indexOf('.')) {
    pathSplit = initPath.split('/')
    pathSplit.shift();
    initPath = pathSplit.join('/');
    initPath = ~initPath.indexOf('/') ? initPath : '/' + initPath;
    result   = basePath + initPath;

  // absolute
  } else {
    result = initPath;
  }

  return result;
}

//
// Join Paths
//
// join path with a leading / and /'s between them
//
// Parameters
//   leading
//     [String] - first path to join
//
//  trailing
//    [String] - second path to join
//
exports.joinPaths = function (leading, trailing) {
  if (!(_.isString(leading) && _.isString(trailing))) { throw new Error('joinPaths requires both leading and trailing to be strings'); }
  if (!(leading && trailing)) { return leading + trailing; }

  var newPath = leading;
  newPath = newPath.indexOf('/') === 0 ? newPath : '/' + newPath;

  if (/\/$/.test(newPath) && ~trailing.indexOf('/')) {
    trailing = trailing.substring(1);

  } else if (!/\/$/.test(newPath) && trailing.indexOf('/')) {
    newPath +=  '/'
  }

  return newPath + trailing;
}


//
// Path To Template
//
// Parameters:
//   templates
//     [Array] - array of path template strings. eg: `/foo/:id`
//
//
exports.templateTracer = function (templates) {
  var tracers = _.map(templates, function (template) {
    return router(template, function *() {
      this.routeConfig.path = template;
    });
  });

  return function *(ctx) {
    ctx.routeConfig = ctx.routeConfig || {};
    _.each(tracers, function (tracer) {
      co(tracer).onerror(function (err) {
        throw new Error('could not find route for path: ' + ctx.request.path)
      });
    });

    return ctx.routeConfig.path;
  }
}
