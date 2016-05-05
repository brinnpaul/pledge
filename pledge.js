'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function $Promise() {
  this.state = 'pending'
  this.value = undefined
  this.handlerGroups = []
  this.updateCbs = []
}

$Promise.prototype.then = function(success, error, updateCbs) {
  var handlers = {}
  if (typeof success === 'function') handlers.successCb = success
  else handlers.successCb = false
  if (typeof error === 'function') handlers.errorCb = error
  else handlers.errorCb = false
  if (typeof updateCbs === 'function') this.updateCbs.push(updateCbs)

  handlers.forwarder = defer()
  // console.log(handlers.forwarder)

  this.handlerGroups.push(handlers)
  this.callHandlers()
  //console.log(handlers.forwarder.$promise)
  return handlers.forwarder.$promise
}

$Promise.prototype.callHandlers = function() {
  while (this.handlerGroups.length && this.state !== 'pending') {
    this.currentHandler = this.handlerGroups.shift()
    if (this.state === 'resolved') {
      if (this.currentHandler.successCb !== false) {
        var handled
        try {
          handled = this.currentHandler.successCb(this.value)
          if (handled instanceof $Promise) {
            handled.then(this.currentHandler.forwarder.resolve.bind(this.currentHandler.forwarder))
          } else {
            this.currentHandler.forwarder.resolve(handled)
          }
        } catch(err) {
          this.currentHandler.forwarder.reject(err)
        }
      } else {
        this.currentHandler.forwarder.resolve(this.value)
      }
    }
    if (this.state === 'rejected') {
      if (this.currentHandler.errorCb !== false) {
        var fhandled
        try {
          fhandled = this.currentHandler.errorCb(this.value)
          if (fhandled instanceof $Promise) {
            fhandled.then(this.currentHandler.forwarder.reject.bind(this.currentHandler.forwarder))
          } else {
            this.currentHandler.forwarder.resolve(fhandled)
          }
        } catch(err) {
          this.currentHandler.forwarder.reject(err)
        }
      } else {
        this.currentHandler.forwarder.reject(this.value)
    }
  }
}
}

$Promise.prototype.catch = function(err) {
  return this.then(null, err);
}

function Deferral() {
  this.$promise = new $Promise()
}

function defer() {
  return new Deferral()
}

Deferral.prototype.resolve = function() {
  if (this.$promise.state === 'pending') {
    this.$promise.value = arguments[0]
    this.$promise.state = 'resolved'
  }
  this.$promise.callHandlers()
}

Deferral.prototype.reject = function() {
  if (this.$promise.state === 'pending') {
    this.$promise.value = arguments[0]
    this.$promise.state = 'rejected'
  }
  this.$promise.callHandlers()
}

Deferral.prototype.notify = function(n) {
  for(var i=0; i < this.$promise.updateCbs.length && this.$promise.state === 'pending'; i++) {
    var updateFn = this.$promise.updateCbs[i]
    updateFn(n)
  }
}



/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = {
  defer: defer,
};

So in a Node-based project we could write things like this:

var pledge = require('pledge');
…
var myDeferral = pledge.defer();
var myPromise1 = myDeferral.$promise;
--------------------------------------------------------*/
