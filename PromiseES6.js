const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
function Promise(executor){
  let self = this;
  self.status = PENDING;
  self.value = undefined;
  self.reason = undefined;
  self.onResolvedCallbacks = [];
  self.onRejectedCallbacks = [];
  // 只有状态是pending 参能进行状态的转化
  function resolve(value) {
    if(self.status === PENDING){
      self.value = value;
      self.status = FULFILLED;
      self.onResolvedCallbacks.forEach(fn => fn());
    }
  }
  function reject(reason) {
    if(self.status === PENDING){
      self.reason = reason;
      self.status = REJECTED;
      self.onRejectedCallbacks.forEach(fn => fn());
    }
  }
  try{
    executor(resolve, reject);
  }catch(e){
    reject(e);
  }
}
// 核心方法 处理 成功或者失败执行的返回值 和promise2的关系
function resolvePromise(promise2, x, resolve, reject) {
  if(promise2 === x){
   return reject(new TypeError('TypeError: Chaining cycle detected for promise #<Promise>'))
  }
  let called;
  if((x!=null&&typeof x=== 'object') || typeof x === 'function'){
    try{
      let then = x.then;
      if(typeof then === 'function'){
        then.call(x,function (y) {
          if(!called){called = true;} else{ return;}
          resolvePromise(x,y,resolve,reject);
        },(r) => {
          if (!called) { called = true; } else { return; }
          reject(r);
        });
      }else{
        resolve(x);
      }
    }catch(e){
      if (!called) { called = true; } else { return; }
      reject(e);
    }
  }else{
    resolve(x);
  }
}
Promise.prototype.then = function (onFulfilled, onRejected) {
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled: data => data;
  onRejected = typeof onRejected === 'function' ? onRejected: err => {
    throw err;
  }
  let self = this;
  let promise2;
  promise2 = new Promise((resolve,reject) => {
    if (self.status === FULFILLED) {
      setTimeout(() => {
        try{
          let x = onFulfilled(self.value);
          resolvePromise(promise2, x, resolve, reject);
        }catch(e){
          reject(e);
        }
      }, 0);
    }
    if (self.status === REJECTED) {
      setTimeout(() => {
        try{
          let x = onRejected(self.reason);
          resolvePromise(promise2, x, resolve, reject);
        }catch(e){
          reject(e)
        }
      },0)
    }
    if (self.status === PENDING) {
      self.onResolvedCallbacks.push(() => {
        setTimeout(() => {
          try{
            let x = onFulfilled(self.value);
            resolvePromise(promise2, x, resolve, reject);
          }catch(e){
            reject(e)
          }
        }, 0);
      });
      self.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try{
            let x = onRejected(self.reason);
            resolvePromise(promise2, x, resolve, reject);
          }catch(e){
            reject(e);
          }
        }, 0);
      })
    }
  });
  return promise2;
  
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
}
Promise.prototype.finally = function (cb) {
  return this.then((data) => {
    cb();
    return data;
  }, (err) => {
    cb();
    throw err;
  });
}
Promise.reject = function (reason) {
  return new Promise((resolve, reject) => {
    reject(reason);
  })
}
Promise.resolve = function (value) {
  return new Promise((resolve, reject) => {
    resolve(value);
  });
}
Promise.all = function (promises) {
  return new Promise((resolve, reject) => {
    let arr = [];
    let i = 0;
    function processData(index, data) {
      arr[index] = data;
      if (++i === promises.length) {
        resolve(arr);
      }
    }
    for (let i = 0; i < promises.length; i++) {
      let promise = promises[i];
      if (typeof promise.then == 'function') {
        promise.then((data) => {
          processData(i, data);
        }, reject);
      } else {
        processData(i, promise);
      }
    }
  });
}
Promise.race = function (promises) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      let promise = promises[i];
      if (typeof promise.then == 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  })
}

// npm install promises-aplus-tests -g
Promise.deferred = Promise.defer = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve,reject)=>{
    dfd.resolve = resolve;
    dfd.reject = reject;
  })
  return dfd;
}
module.exports = Promise;