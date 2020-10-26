//import "core-js/stable";
//import "regenerator-runtime/runtime";
'use strict';
//const version = require("../package.json").version;
import Package from '../package.json';
//import isregexp from 'lodash.isregexp';
const nativeWebSocket = window.WebSocket ? true : false;
import querystring from 'querystring';
import browser from './core/browser.es6';
import url from 'url';
import util from "util";
import {
  v4 as uuidv4
} from 'uuid';

import Events from './core/events.es6';
import error from './core/error.es6';
import Syslog from './core/syslog/syslog.es6';
import Container from './core/container.es6';
import Service from './core/service.es6';
import Storage from './core/storage/storage.es6';
import Websocket from './transports/websocket/websocket.es6';
import Api from './api/api.es6';
import Kernel from './kernel/kernel.es6';
//import webrtc from './src/medias/webrtc/webrtc.es6';
//nodefony.medias.webrtc = webrtc(nodefony);
//import transaction from './src/medias/webrtc/transaction.es6';
//nodefony.medias.webrtcTransaction = transaction(nodefony);
//import user from './src/medias/webrtc/user.es6';
//nodefony.medias.userMedia = user(nodefony);

class Nodefony {
  constructor(env) {
    this.version = Package.version;
    this.environment = env;
    this.isRegExp = util.isRegExp;
    this.isObject = util.isObject;
    this.isFunction = util.isFunction;
    this.isNullOrUndefined = util.isNullOrUndefined;
    this.isUndefined = util.isUndefined;
    this.isArray = util.isArray;
    this.inspect = util.inspect;
    this.browser = browser;
    this.protocols = {};
    this.nativeWebSocket = nativeWebSocket;
    this.URL = url;
    this.util = util;
    Events(this);
    error(this);
    Syslog(this);
    Container(this);
    Service(this);
    Storage(this);
    Websocket(this);
    Api(this);
    Kernel(this);
  }

  async load(obj = null) {
    if (!obj) {
      obj = this.getQuery();
    }
    if (obj) {
      console.debug(`load query for Prefetch module : `, obj);
      for (let lib in obj) {
        if (lib === "medias") {
          console.debug(`Nodefony Prefetch module ${lib}`);
          await this.prefetchMedias();
        }
        if (lib === "socket") {
          console.debug(`Nodefony Prefetch module ${lib}`);
          await this.prefetchSocket();
        }
        if (lib === "webaudio") {
          console.debug(`Nodefony Prefetch module ${lib}`);
          await this.prefetchWebAudio();
        }
      }
    }
  }

  async prefetchMedias() {
    // medias
    await import( /* webpackPrefetch: true , webpackChunkName: "chunk-nodefony-medias" */ './medias/medias.es6')
    .then((module) => {
      return module.default(this);
    });
  }

  async prefetchWebAudio() {
    // medias webaudio
    await import( /* webpackPrefetch: true , webpackChunkName: "chunk-nodefony-webaudio" */ './medias/webaudio/webaudio.es6')
    .then((module) => {
      return module.default(this);
    });
  }

  async prefetchSocket() {
    // socket
    return await import( /* webpackPrefetch: true , webpackChunkName: "chunk-nodefony-socket" */ './transports/socket.es6')
      .then((module) => {
        return module.default(this);
      });
  }

  getQuery() {
    try {
      if (document.currentScript) {
        let myurl = url.parse(document.currentScript.src);
        if (myurl.query) {
          return querystring.parse(myurl.query);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  querystring(query) {
    return querystring.parse(query);
  }

  getUuid() {
    return uuidv4();
  }

  basename(path) {
    return path.replace(/\\/g, '/').replace(/.*\//, '');
  }

  dirname(path) {
    return path.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
  }

  url(href) {
    return url.parse(href);
  }

  /**
   *  @method typeOf
   *  @param  value
   *  @return {String} type of value
   */
  typeOf(value) {
    let t = typeof value;
    if (t === 'object') {

      if (value === null) {
        return null;
      }
      if (this.isArray(value)) {
        return "array";
      }
      if (this.isFunction(value)) {
        return 'function';
      }
      if (value instanceof Date) {
        return "date";
      }
      if (this.isRegExp(value)) {
        return "RegExp";
      }
      if (value.callee) {
        return "arguments";
      }
      if (value instanceof SyntaxError) {
        return "SyntaxError";
      }
      if (value instanceof Error) {
        return "Error";
      }
    } else {
      if (t === 'function' && typeof value.call === 'undefined') {
        return 'object';
      }
    }
    return t;
  }

  extend() {
    let options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
      deep = target;
      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }
    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && this.isFunction(target)) {
      target = {};
    }
    // Extend jQuery itself if only one argument is passed
    if (i === length) {
      target = this;
      i--;
    }
    for (; i < length; i++) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) !== null) {
        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];
          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }
          // Recurse if we're merging plain objects or arrays
          let bool = this.typeOf(copy);
          if (deep && copy && (bool === "object" ||
              (copyIsArray = (bool === "array")))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && bool === "array" ? src : [];
            } else {
              clone = src && bool === "object" ? src : {};
            }
            // Never move original objects, clone them
            target[name] = this.extend(deep, clone, copy);
            // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    // Return the modified object
    return target;
  }

  isContainer(container) {
    if (container) {
      if (container instanceof nodefony.Container) {
        return true;
      }
      if (container.protoService && container.protoParameters) {
        return true;
      }
      return false;
    }
    return false;
  }

  isPromise(obj) {
    switch (true) {
    case obj instanceof Promise:
      return true;
    default:
      return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
    }
  }

  isSameOrigin(Url) {
    const loc = window.location;
    const a = url.parse(Url);
    return a.hostname === loc.hostname &&
      a.port == loc.port &&
      a.protocol === loc.protocol;
  }

  isSecure(Url = null) {
    const a = Url ? url.parse(Url) : window.location.href;
    return a.protocol === "https:" || a.protocol === "wss:";
  }

}
export default Nodefony;
