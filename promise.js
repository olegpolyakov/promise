class Promise {
    static state = {
        PENDING: 'pending',
        FULFILLED: 'fulfilled',
        REJECTED: 'rejected'
    };

    static resolve(value) {
        return new Promise(resolve => resolve(value));
    }

    static reject(value) {
        return new Promise((resolve, reject) => reject(value));
    }

    static all(promises) {
        var index = 0,
            promiseCount = promises.length;

        return new Promise(function (fulfill, reject) {
            var promise,
                results = [],
                resultsCount = 0;

            function onSuccess(result, index) {
                results[index] = result;
                resultsCount++;

                if (resultsCount === promiseCount) {
                    fulfill(results);
                }
            }

            function onError(error) {
                reject(error);
            }
            
            function resolvePromise(index, promise) {
                promise.then(function (value) {
                    onSuccess(value, index);
                }, onError);
            }

            for (; index < promiseCount; index++) {
                promise = promises[index];
                resolvePromise(index, promise);
            }
        });
    }

    constructor(execute) {
        this.state = Promise.state.PENDING;
        this.value = null;
        this.error = null;
        this.callbacks = [];

        if (typeof execute === 'function') {
            execute(this.resolve.bind(this), this.reject.bind(this));
        }
    }

    then(onFulfilled, onRejected) {
        const promise = new Promise();
        const callback = {
            promise
        };

        if (typeof onFulfilled === 'function') {
            callback.fulfill = onFulfilled;
        }

        if (typeof onRejected === 'function') {
            callback.reject = onRejected;
        }

        this.callbacks.push(callback);

        this.executeCallbacks();

        return promise;
    }

    executeCallbacks() {
        function fulfill(value) {
            return value;
        }

        function reject(reason) {
            throw reason;
        }

        if (this.state !== Promise.state.PENDING) {
            let value;

            setTimeout(() => {
                while (this.callbacks.length) {
                    const callback = this.callbacks.shift();

                    try {
                        if (this.state === Promise.state.FULFILLED) {
                            value = (callback.fulfill || fulfill)(this.value);
                        } else {
                            value = (callback.reject || reject)(this.error);
                        }

                        callback.promise.resolve(value);
                    } catch (reason) {
                        callback.promise.reject(reason);
                    }
                }
            }, 0);
        }
    }

    fulfill(value) {
        if (this.state === Promise.state.PENDING && arguments.length) {
            this.state = Promise.state.FULFILLED;
            this.value = value;

            this.executeCallbacks();
        }
    }

    reject(reason) {
        if (this.state === Promise.state.PENDING && arguments.length) {
            this.state = Promise.state.REJECTED;
            this.error = reason;

            this.executeCallbacks();
        }
    }

    resolve(value) {
        const valueIsThisPromise = this === value;
        const valueIsAPromise = value && value.constructor === Promise;
        const valueIsThenable = value && (typeof value === 'object' || typeof value === 'function');
        let isExecuted = false;
        let then;

        if (valueIsThisPromise) {
            this.reject(new TypeError());
        } else if (valueIsAPromise) {
            if (value.state === Promise.state.FULFILLED) {
                this.fulfill(value.value);
            } else if (value.state === Promise.state.REJECTED) {
                this.reject(value.error);
            } else {
                value.then(
                    value => this.resolve(value),
                    reason => this.reject(reason)
                );
            }
        } else if (valueIsThenable) {
            try {
                then = value.then;
                
                if (typeof then === 'function') {
                    then.call(value,
                        successValue => {
                            if (!isExecuted) {
                                isExecuted = true;
                                this.resolve(successValue);
                            }
                        }, reason => {
                            if (!isExecuted) {
                                isExecuted = true;
                                this.reject(reason);
                            }
                        }
                    );
                } else {
                    this.fulfill(value);
                }
            } catch (reason) {
                if (!isExecuted) {
                    isExecuted = true;
                    this.reject(reason);
                }
            }
        } else {
            this.fulfill(value);
        }
    }
}

if (typeof module === 'object' && module.exports) {
    module.exports = Promise;
}