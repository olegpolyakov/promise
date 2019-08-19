class Promise {
    static state = {
        PENDING: 'PENDING',
        FULFILLED: 'FULFILLED',
        REJECTED: 'REJECTED'
    };

    static defer(fn, ms = 0) {
        setTimeout(fn, ms);
    }

    static resolve(value) {
        return new Promise(resolve => resolve(value));
    }

    static reject(value) {
        return new Promise((resolve, reject) => reject(value));
    }

    static all(promises) {
        return new Promise((resolve, reject) => {
            const results = [];

            promises.forEach((promise, index) => {
                promise.then(result => {
                    results[index] = result;
    
                    if (results.length === promises.length) {
                        resolve(results);
                    }
                }, reject);
            });
        });
    }

    static race(promises) {
        return new Promise((resolve, reject) => {
            let done;

            promises.forEach(promise => {
                promise.then(result => {
                    if (!done) {
                        done = true;
                        resolve(result);
                    }
                }, reject);
            });
        });
    }

    constructor(execute) {
        if (typeof this !== 'object') {
            throw new TypeError('Promises must be constructed via new');
        }

        this.state = Promise.state.PENDING;
        this.result = null;
        this.reason = null;
        this.onFulfilled = [];
        this.onRejected = [];

        if (typeof execute !== 'function') {
            throw new TypeError('Promise constructor\'s argument is not a function');
        }

        try {
            execute(this._resolve.bind(this), this._reject.bind(this));
        } catch (error) {
            this._reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
            function _onFulfilled(result) {
                if (typeof onFulfilled === 'function') {
                    try {
                        resolve(onFulfilled(result));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(result);
                }
            }

            function _onRejected(reason) {
                if (typeof onRejected === 'function') {
                    try {
                        resolve(onRejected(reason));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(reason);
                }
            }
            
            if (this.state === Promise.state.PENDING) {
                this.onFulfilled.push(_onFulfilled);
                this.onRejected.push(_onRejected);
            } else if (this.state === Promise.state.FULFILLED) {
                Promise.defer(() => _onFulfilled(this.result));
            } else if (this.state === Promise.state.REJECTED) {
                Promise.defer(() => _onRejected(this.reason));
            }
        });
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }

    _resolve(value) {
        const isPromise = value instanceof Promise;
        const isObjectOrFunction =
            (value !== null && value !== undefined) &&
            (typeof value === 'object' || typeof value === 'function');

        if (this === value) {
            this._reject(new TypeError());
        } else if (isPromise) {
            if (value.state === Promise.state.FULFILLED) {
                this._fulfill(value.result);
            } else if (value.state === Promise.state.REJECTED) {
                this._reject(value.reason);
            } else if (value.state === Promise.state.PENDING) {
                value.then(
                    value => this._resolve(value),
                    reason => this._reject(reason)
                );
            }
        } else if (isObjectOrFunction) {
            let isDone = false;
            let then;

            try {
                then = value.then;

                if (typeof then === 'function') {
                    then.call(value,
                        result => {
                            if (!isDone) {
                                isDone = true;
                                this._resolve(result);
                            }
                        },
                        reason => {
                            if (!isDone) {
                                isDone = true;
                                this._reject(reason);
                            }
                        }
                    );
                } else {
                    this._fulfill(value);
                }
            } catch (reason) {
                if (!isDone) {
                    isDone = true;
                    this._reject(reason);
                }
            }
        } else {
            this._fulfill(value);
        }
    }

    _fulfill(result) {
        if (this.state === Promise.state.PENDING) {
            this.state = Promise.state.FULFILLED;
            this.result = result;
            Promise.defer(() => this.onFulfilled.forEach(callback => callback(this.result)));
        }
    }

    _reject(reason) {
        if (this.state === Promise.state.PENDING) {
            this.state = Promise.state.REJECTED;
            this.reason = reason;
            Promise.defer(() => this.onRejected.forEach(callback => callback(this.reason)));
        }
    }
}

module.exports = Promise;