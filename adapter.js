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
        let promise = new Promise((resolve, reject) => {
            resolve = resolve;
            reject = reject;
        });

        return {
            promise,
            resolve,
            reject
        };
    }
};