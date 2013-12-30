// __Dependencies__
var url = require('url');
var connect = require('connect');

// __Module Definition__
var mixin = module.exports = function (activate) {
  var controller = this;

  // Add "Link" header field, with some basic defaults
  activate(false, 'query', 'instance', '*', function (request, response, next) {
    if (controller.get('relations') !== true) return next();

    var originalPath = request.originalUrl.split('?')[0];
    var originalPathParts = originalPath.split('/');
    var linkBase;

    originalPathParts.pop();
    linkBase = originalPathParts.join('/');

    response.links({
      collection: linkBase,
      search: linkBase,
      edit: url.resolve(linkBase, request.params.id),
      self: originalPath
    });

    next();
  });

  // Add "Link" header field, with some basic defaults (for collection routes)
  activate(false, 'query', 'collection', '*', function (request, response, next) {
    if (controller.get('relations') !== true) return next();

    var makeLink = function (query) {
      var newQuery = connect.utils.merge(request.query, query);
      var originalPath = request.originalUrl.split('?')[0];
      return originalPath + '?' + qs.stringify(newQuery);
    };
    var done = function () { response.links(links), next() };
    var links = { search: makeLink(), self: makeLink() };

    // Add paging links if these conditions are not met
    if (request.method !== 'GET') return done();
    if (!request.query.limit) return done();

    request.baucis.query.count(function (error, count) {
      if (error) return next(error);

      var limit = Number(request.query.limit);
      var skip = Number(request.query.skip || 0);

      links.first = makeLink({ skip: 0 });
      links.last = makeLink({ skip: Math.max(0, count - limit) });

      if (skip) links.previous = makeLink({ skip: Math.max(0, skip - limit) });
      if (limit + skip < count) links.next = makeLink({ skip: limit + skip });

      done();
    });
  });

  return controller;
};