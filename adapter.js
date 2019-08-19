const Promise = require('./promise');

module.exports = {
    resolved: function(value) {
        return Promise.resolve(value);
    },

    rejected: function(reason) {
        return Promise.reject(reason);
    },

    deferred: function() {
        let resolve;
        let reject;
        let promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        return {
            promise,
            resolve,
            reject
        };
    }
};