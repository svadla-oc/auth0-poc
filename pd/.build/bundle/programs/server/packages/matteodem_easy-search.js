(function () {

/* Imports */
var _ = Package.underscore._;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;
var Log = Package.logging.Log;
var Tracker = Package.deps.Tracker;
var Deps = Package.deps.Deps;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var EasySearch;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem_easy-search/lib/easy-search-common.js                                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
EasySearch = (function () {
  'use strict';

  var ESCounts,
    Searchers,
    indexes = {/** @see defaultOptions */},
    defaultOptions = {
      'format' : 'mongo',
      'skip' : 0,
      'limit' : 10,
      'use' : 'minimongo',
      'reactive' : true,
      'useTextIndexes' : false,
      'props' : {},
      'permission'  : function () {
        return true;
      },
      'transform' : function () {},
      'sort' : function () {
        if (Searchers[this.use]) {
          return Searchers[this.use].defaultSort(this);
        }

        return {};
      },
      'reactiveSort' : function () {
        if ('minimongo' === this.use || 'mongo-db' === this.use) {
          return this.sort();
        }

        return ['_sortedOrder'];
      },
      'count' : function () {
        var doc = ESCounts.findOne({ _id : this.name });

        if (doc) {
          return doc.count;
        }

        return 0;
      },
      'changeResults' : function (results) {
        return results;
      },
      /**
       * When using elastic-search it's the query object,
       * while using with mongo-db it's the selector object.
       *
       * @param {String} searchString
       * @param {Object} options
       * @return {Object}
       */
      'query' : function (searchString, options) {
        return Searchers[this.use].defaultQuery(this, searchString);
      }
    };

  ESCounts = new Mongo.Collection('esCounts');

  /** Helper Functions */
  function setUpPublication(name, opts) {
    Meteor.publish(name + '/easySearch', function (conf) {
      var resultSet,
        resultArray,
        findOptions = {},
        publishScope = this,
        resultIds = [],
        publishHandle;

      check(conf, { value: Match.Optional(String), skip: Number, limit: Match.Optional(Number), props: Object });

      if(!(indexes[name].permission())) {
        throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
      }

      indexes[name].skip = conf.skip;
      indexes[name].limit = conf.limit || indexes[name].limit;
      indexes[name].props = _.extend(indexes[name].props, conf.props);
      indexes[name].publishScope = this;

      if (!conf.value) {
        conf.value = '';
      }

      resultSet = Searchers[opts.use].search(name, conf.value, indexes[name]);

      ESCounts.update({ _id: name }, { $set: { count: resultSet.total } }, { upsert: true });

      if (!resultSet.results.length) return this.ready();

      if (_.isObject(resultSet.results[0])) {
        resultIds = _.pluck(resultSet.results, '_id');
      } else if (_.isString(resultSet.results[0])) {
        resultIds = resultSet.results;
      }

      // properly observe the collection!
      if (opts.returnFields) {
        findOptions.fields = EasySearch._transformToFieldSpecifiers(opts.returnFields);
      }

      // TODO: this doesn't work properly, that's why resultIds are used for now
      // see http://stackoverflow.com/questions/3142260/order-of-responses-to-mongodb-in-query
      resultArray = _.map(resultIds, function (id) {
        return { _id: id };
      });

      publishHandle = opts.collection
        .find({ $or: resultArray }, findOptions)
        .observe({
          added: function (doc) {
            doc._index = name;
            doc._sortedOrder = resultIds.indexOf(doc._id);
            publishScope.added('esSearchResults', doc._id, doc);
          },
          changed: function (doc) {
            doc._sortedOrder = resultIds.indexOf(doc._id);
            publishScope.changed('esSearchResults', doc._id, doc);
          },
          removed: function (doc) {
            publishScope.removed('esSearchResults', doc._id);
          }
        }
      );

      publishScope.onStop(function () {
        publishHandle.stop();
      });

      publishScope.ready();
    });

    Meteor.publish(name + '/easySearchCount', function () {
      return ESCounts.find({ '_id' : name });
    });
  }

  function extendTransformFunction(collection, originalTransform) {
    return function (doc) {
      var transformedDoc = collection._transform(doc);
      return _.isFunction(originalTransform) ? originalTransform(transformedDoc) : transformedDoc;
    };
  }

  if (Meteor.isClient) {
    /**
     * find method to let users interact with search results.
     *
     * @param {Object} selector
     * @param {Object} options
     * @returns {MongoCursor}
     */
    defaultOptions.find = function (selector, options) {
      selector = selector || {};
      selector._index = this.name;

      if (this.collection._transform) {
        options.transform = extendTransformFunction(this.collection, options.transform);
      }

      return ESSearchResults.find(selector, options);
    };

    /**
     * findOne method to let users interact with search results.
     *
     * @param {Object} selector
     * @param {Object} options
     * @returns {Document}
     */
    defaultOptions.findOne = function (selector, options) {
      if (_.isObject(selector) || !selector) {
        selector = selector || {};
        selector._index = this.name;
      }

      if (this.collection._transform) {
        options.transform = extendTransformFunction(this.collection, options.transform);
      }

      return ESSearchResults.findOne(selector, options);
    };
  }


  /**
   * Searchers contains all engines that can be used to search content, until now:
   *
   * minimongo (client): Client side collection for reactive search
   * elastic-search (server): Elastic search server to search with (fast)
   * mongo-db (server): MongoDB on the server to search (more convenient)
   *
   */
  Searchers = {};

  return {
    /**
     * Placeholder config method.
     *
     * @param {Object} newConfig
     */
    'config' : function (newConfig) {
      return {};
    },
    /**
     * Simple logging method.
     *
     * @param {String} message
     * @param {String} type
     */
    'log' : function (message, type) {
      type = type || 'log';

      if (console && _.isFunction(console[type])) {
        return console[type](message);
      } else if (console && _.isFunction(console.log)) {
        return console.log(message);
      }
    },
    /**
     * Create a search index.
     *
     * @param {String} name
     * @param {Object} options
     */
    'createSearchIndex' : function (name, options) {
      check(name, Match.OneOf(String, null));
      check(options, Object);

      options.name = name;
      options.field = _.isArray(options.field) ? options.field : [options.field];
      indexes[name] = _.extend(_.clone(defaultOptions), options);

      options = indexes[name];

      if (Meteor.isServer && EasySearch._usesSubscriptions(name)) {
        setUpPublication(name, indexes[name]);
      }

      Searchers[options.use] && Searchers[options.use].createSearchIndex(name, options);
    },
    /**
     * Perform a search.
     *
     * @param {String} name             the search index
     * @param {String} searchString     the string to be searched
     * @param {Object} options          defined with createSearchIndex
     * @param {Function} callback       optional callback to be used
     */
    'search' : function (name, searchString, options, callback) {
      var results,
        index = indexes[name],
        searcherType = index.use;

      check(name, String);
      check(searchString, String);
      check(options, Object);
      check(callback, Match.Optional(Function));

      if ("undefined" === typeof Searchers[searcherType]) {
        throw new Meteor.Error(500, "Couldnt search with type: '" + searcherType + "'");
      }

      if(!(indexes[name].permission())) {
        throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
      }

      results = Searchers[searcherType].search(name, searchString, _.extend(indexes[name], options), callback);

      return index.changeResults(results);
    },
    /**
     * Retrieve a specific index configuration.
     *
     * @param {String} name
     * @return {Object}
     * @api public
     */
    'getIndex' : function (name) {
      return indexes[name];
    },
    /**
     * Retrieve all index configurations
     */
    'getIndexes' : function () {
      return indexes;
    },
    /**
     * Retrieve a specific Seacher.
     *
     * @param {String} name
     * @return {Object}
     * @api public
     */
    'getSearcher' : function (name) {
      return Searchers[name];
    },
    /**
     * Retrieve all Searchers.
     */
    'getSearchers' : function () {
      return Searchers;
    },
    /**
     * Loop through the indexes and provide the configuration.
     *
     * @param {Array|String} indexes
     * @param callback
     */
    'eachIndex' : function (indexes, callback) {
      indexes = !_.isArray(indexes) ? [indexes] : indexes;

      _.each(indexes, function (index) {
        callback(index, EasySearch.getIndex(index));
      });
    },
    /**
     * Makes it possible to override or extend the different
     * types of search to use with EasySearch (the "use" property)
     * when using EasySearch.createSearchIndex()
     *
     * @param {String} key      Type, e.g. mongo-db, elastic-search
     * @param {Object} methods  Methods to be used, only 2 are required:
     *                          - createSearchIndex (name, options)
     *                          - search (name, searchString, [options, callback])
     *                          - defaultQuery (options, searchString)
     *                          - defaultSort (options)
     */
    'createSearcher' : function (key, methods) {
      check(key, String);
      check(methods.search, Function);
      check(methods.createSearchIndex, Function);

      Searchers[key] = methods;
    },
    /**
     * Helper to check if searcher uses server side subscriptions for searching.
     *
     * @param {String} index Index name to check configuration for
     */
    '_usesSubscriptions' : function (index) {
      var conf = EasySearch.getIndex(index);
      return conf && conf.reactive && conf.use !== 'minimongo';
    },
    /**
     * Helper to transform an array of fields to Meteor "Field Specifiers"
     *
     * @param {Array} fields Array of fields
     */
    '_transformToFieldSpecifiers' : function (fields) {
      var specifiers = {};

      _.each(fields, function (field) {
        specifiers[field] = 1;
      });

      return specifiers;
    }
  };
})();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem_easy-search/lib/easy-search-convenience.js                                                  //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.Collection.prototype.initEasySearch = function (fields, options) {
  if (!_.isObject(options)) {
    options = {};
  }

  EasySearch.createSearchIndex(this._name, _.extend(options, {
    'collection' : this,
    'field' : fields
  }));
};

if (Meteor.isClient) {
  jQuery.fn.esAutosuggestData = function () {
    var input = $(this);

    if (input.prop("tagName").toUpperCase() !== 'INPUT') {
      return [];
    }

    return EasySearch.getComponentInstance({'id': input.parent().data('id'), 'index': input.parent().data('index')}).get('autosuggestSelected');
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem_easy-search/lib/searchers/mongo.js                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var methods = {
  /**
   * Set up a search index.
   *
   * @param name
   * @param options
   * @returns {void}
   */
  'createSearchIndex' : function (name, options) {
    if (Meteor.isServer && options.useTextIndexes) {
      var indexDoc = EasySearch._transformFieldsToIndexDocument(options.field),
        rawCollection = EasySearch.getIndex(name).collection.rawCollection(),
        indexOptions = { name: name };

      if (options.weights) {
        indexOptions.weights = options.weights();
      }

      rawCollection.createIndex(
        indexDoc, indexOptions, function (err, res) {
          options.onCreatedIndex && options.onCreatedIndex(res);
        }
      );
    }
  },
  /**
   *
   * Perform a really simple search with mongo db.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   * @param {Function} callback
   * @returns {Object}
   */
  'search' : function (name, searchString, options, callback) {
    var cursor,
      results,
      selector,
      pipeline,
      aggregates,
      cursorOptions,
      index = EasySearch.getIndex(name);

    if (!_.isObject(index)) {
      return;
    }

    options.limit = options.limit || 10;

    // if several, fields do an $or search, otherwise only over the field
    selector = index.query(searchString, options);

    if (!selector) {
      return { total: 0, results: [] };
    }

    cursorOptions = {
      sort : index.sort(searchString, options)
    };

    if (options.returnFields) {
      cursorOptions.fields = EasySearch._transformToFieldSpecifiers(options.returnFields);
    }

    if (options.skip) {
      cursorOptions.skip = options.skip;
    }

    if (Meteor.isServer) {
      cursorOptions.limit = options.limit;
    }

    if (options.useTextIndexes) {
      if (!cursorOptions.fields) {
        cursorOptions.fields = {};
      }

      cursorOptions.fields.score = { $meta: 'textScore'  };
    }

    cursor = index.collection.find(selector, cursorOptions);

    if (Meteor.isServer) {
      // Get the total count by aggregating
      pipeline = [
        { $match: selector },
        {
          $group: { _id: "id", total: { $sum: 1 } }
        }
      ];

      aggregates = index.collection.aggregate(pipeline);

      results = {
        'results': cursor.fetch(),
        'total': aggregates.length >= 1 ? aggregates[0].total : 0
      };
    } else {
      // The aggregate operations are not supported on client,
      // so we have to explicitly count all records in the search result


      results = {
        'results' : _.first(cursor.fetch(), options.limit),
        'total' : cursor.count()
      };
    }

    if (_.isFunction(callback)) {
      callback(results);
    }

    return results;
  },
  /**
   * The default mongo-db query - selector used for searching.
   *
   * @param {Object} conf
   * @param {String} searchString
   * @param {Function} regexCallback
   *
   * @returns {Object}
   */
  'defaultQuery' : function (conf, searchString, regexCallback) {
    if (Meteor.isServer && conf.useTextIndexes) {
      return { $text: { $search: searchString } };
    } else if (Meteor.isClient || !conf.useTextIndexes) {
      // Convert numbers if configured
      if (conf.convertNumbers && parseInt(searchString, 10) == searchString) {
        searchString = parseInt(searchString, 10);
      }

      var stringSelector = { '$regex' : '.*' + searchString + '.*', '$options' : 'i'},
        selector = {
          $or: []
        };

      if (regexCallback) {
        stringSelector['$regex'] = regexCallback(searchString);
      }

      _.each(conf.field, function (fieldString) {
        var orSelector = {};

        if (_.isString(searchString)) {
          orSelector[fieldString] = stringSelector;
        } else if (_.isNumber(searchString)) {
          orSelector[fieldString] = searchString;
        }

        selector['$or'].push(orSelector);
      });

      return selector;
    }
  },
  /**
   * The default mongo-db sorting method used for sorting the results.
   *
   * @param {Object} conf
   * @return array
   */
  'defaultSort' : function (conf) {
    return conf.field;
  }
};

if (Meteor.isClient) {
  EasySearch.createSearcher('minimongo', methods);
} else if (Meteor.isServer) {
  EasySearch.createSearcher('mongo-db', methods);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem_easy-search/lib/easy-search-server.js                                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
'use strict';
var ElasticSearch = Npm.require('elasticsearch');

EasySearch._esDefaultConfig = {
  host : 'localhost:9200'
};

/**
 * Override the config for Elastic Search.
 *
 * @param {object} newConfig
 */
EasySearch.config = function (newConfig) {
  if ("undefined" !== typeof newConfig) {
    check(newConfig, Object);
    this._config = _.extend(this._esDefaultConfig, newConfig);
    this.ElasticSearchClient = new ElasticSearch.Client(this._config);
  }

  return this._config;
};

/**
 * Get the ElasticSearchClient
 * @see http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current
 *
 * @return {ElasticSearch.Client}
 */
EasySearch.getElasticSearchClient = function () {
  return this.ElasticSearchClient;
};

/**
 * Transforms the field definition to a MongoDB index doc definition.
 *  
 * @param {Array} fields
 *
 * @returns {Object}
 */
EasySearch._transformFieldsToIndexDocument = function (fields) {
  var indexDoc = {};

  _.each(fields, function (field) {
    indexDoc[field] = 'text';
  });

  return indexDoc;
};

Meteor.methods({
  /**
   * Make server side search possible on the client.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   */
  easySearch: function (name, searchString, options) {
    check(name, String);
    check(searchString, String);
    check(options, Object);
    return EasySearch.search(name, searchString, options);
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/matteodem_easy-search/lib/searchers/elastic-search.js                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
'use strict';

var Future = Npm.require('fibers/future'),
  ElasticSearch = Npm.require('elasticsearch');

/**
 * Return Elastic Search indexable data.
 *
 * @param {Object} doc the document to get the values from
 * @return {Object}
 */
function getESFields(doc) {
  var newDoc = {};

  _.each(doc, function (value, key) {
    newDoc[key] = _.isObject(value) && !_.isArray(value) && !_.isDate(value) ? JSON.stringify(value) : value;
  });

  return newDoc;
}

EasySearch.createSearcher('elastic-search', {
  /**
   * Write a document to a specified index.
   *
   * @param {String} name
   * @param {Object} doc
   * @param {String} id
   * @param {Object} opts
   * @param {Object} config
   */
  'writeToIndex' : function (name, doc, id, opts, config) {
    var debugMode = config.debug,
        transformedDoc = opts.transform(doc);

    if (_.isObject(transformedDoc)) {
      doc = transformedDoc;
    }

    // add to index
    EasySearch.ElasticSearchClient.index({
      index : name.toLowerCase(),
      type : 'default',
      id : id,
      body : doc
    }, function (err, data) {
      if (err) {
        console.log('Had error adding a document!');
        console.log(err);
      }

      if (debugMode && console) {
        console.log('EasySearch: Added / Replaced document to Elastic Search:');
        console.log('EasySearch: ' + data + "\n");
      }
    });
  },
  /**
   * Setup some observers on the mongo db collection provided.
   *
   * @param {String} name
   * @param {Object} options
   */
  'createSearchIndex' : function (name, options) {
    var searcherScope = this,
      config = EasySearch.config() || {};

    if ("undefined" === typeof EasySearch.ElasticSearchClient) {
      EasySearch.ElasticSearchClient = new ElasticSearch.Client(this._esDefaultConfig);
    }

    name = name.toLowerCase();

    options.collection.find().observeChanges({
      added: function (id, fields) {
        searcherScope.writeToIndex(name, getESFields(fields), id, options, config);
      },
      changed: function (id) {
        // Overwrites the current document with the new doc
        searcherScope.writeToIndex(name, getESFields(options.collection.findOne(id)), id, options, config);
      },
      removed: function (id) {
        EasySearch.ElasticSearchClient.delete({
          index: name,
          type: 'default',
          id: id
        }, function (error, response) {
          if (config.debug) {
            console.log('Removed document with id ( ' +  id + ' )!');
          }
        });
      }
    });
  },
  /**
   * Get the data out of the JSON elastic search response.
   *
   * @param {Object} data
   * @returns {Array}
   */
  'extractJSONData' : function (data) {
    data = _.isString(data) ? JSON.parse(data) : data;

    var results = _.map(data.hits.hits, function (resultSet) {
      var field = '_source';

      if (resultSet['fields']) {
        field = 'fields';
      }

      resultSet[field]['_id'] = resultSet['_id'];
      return resultSet[field];
    });

    return {
      'results' : results,
      'total' : data.hits.total
    };
  },
  /**
   * Perform a search with Elastic Search, using fibers.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   * @param {Function} callback
   * @returns {*}
   */
  'search' : function (name, searchString, options, callback) {
    var bodyObj,
      that = this,
      fut = new Future(),
      index = EasySearch.getIndex(name);

    if (!_.isObject(index)) {
      return;
    }

    bodyObj = {
      "query" : index.query(searchString, options)
    };

    if (!bodyObj.query) {
      return { total: 0, results: [] };
    }

    bodyObj.sort = index.sort(searchString, options);

    if (options.returnFields) {
      if (options.returnFields.indexOf('_id') === -1 ) {
        options.returnFields.push('_id');
      }

      bodyObj.fields = options.returnFields;
    }

    // Modify Elastic Search body if wished
    if (index.body && _.isFunction(index.body)) {
      bodyObj = index.body(bodyObj, options);
    }

    name = name.toLowerCase();

    if ("function" === typeof callback) {
      EasySearch.ElasticSearchClient.search(name, bodyObj, callback);
      return;
    }

    // Most likely client call, return data set
    EasySearch.ElasticSearchClient.search({
      index : name,
      body : bodyObj,
      size : options.limit,
      from: options.skip
    }, function (error, data) {
      if (error) {
        console.log('Had an error while searching!');
        console.log(error);
        return;
      }

      if ("raw" !== index.format) {
        data = that.extractJSONData(data);
      }

      fut['return'](data);
    });

    return fut.wait();
  },
  /**
   * The default ES query object used for searching the results.
   *
   * @param {Object} options
   * @param {String} searchString
   * @return array
   */
  'defaultQuery' : function (options, searchString) {
    return {
      "fuzzy_like_this" : {
        "fields" : options.field,
        "like_text" : searchString
      }
    };
  },
  /**
   * The default ES sorting method used for sorting the results.
   *
   * @param {Object} options
   * @return array
   */
  'defaultSort' : function (options) {
    return options.field;
  }
});

// Expose ElasticSearch API
EasySearch.ElasticSearch = ElasticSearch;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['matteodem:easy-search'] = {}, {
  EasySearch: EasySearch
});

})();

//# sourceMappingURL=matteodem_easy-search.js.map
