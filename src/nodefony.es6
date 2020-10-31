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
import pdu from './core/syslog/pdu.es6';
import syslog from './core/syslog/syslog.es6';
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
    this.crypto = {};
    this.nativeWebSocket = nativeWebSocket;
    this.URL = url;
    this.util = util;
    this.Events = Events(this);
    this.Error = error(this);
    this.PDU = pdu(this);
    this.Syslog = syslog(this);
    this.Service = Service(this);
    this.Storage = Storage(this);
    this.WebSocket = Websocket(this);
    this.Api = Api(this);
    this.Kernel = Kernel(this);
  }

  static isError(error) {
    switch (true) {
    case error instanceof ReferenceError:
      return "ReferenceError";
    case error instanceof TypeError:
      return "TypeError";
    case error instanceof SyntaxError:
      return "SyntaxError";
    case error instanceof Error:
      if (error.errno) {
        return "SystemError";
      }
      if (error.bytesParsed) {
        return "ClientError";
      }
      try {
        return error.constructor.name || "Error";
      } catch (e) {
        return "Error";
      }
    }
    return false;
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
        if (lib === "webrtc") {
          console.debug(`Nodefony Prefetch module ${lib}`);
          await this.prefetchWebRtc();
        }
        if (lib === "sip") {
          console.debug(`Nodefony Prefetch module ${lib}`);
          await this.prefetchSip();
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
    return await import( /* webpackPrefetch: true , webpackChunkName: "chunk-nodefony-socket" */ './transports/socket/socket.es6')
      .then((module) => {
        return module.default(this);
      });
  }
  async prefetchWebRtc() {
    // webrtc
    return await import( /* webpackPrefetch: true , webpackChunkName: "chunk-nodefony-webrtc" */ './medias/webrtc/webrtc.es6')
      .then((module) => {
        return module.default(this);
      });
  }
  async prefetchSip() {
    // sip
    return await import( /* webpackPrefetch: true , webpackChunkName: "chunk-nodefony-sip" */ './protocols/sip/sip.es6')
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

  generateId() {
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
      let res = null;
      if (res = Nodefony.isError(value)) {
        return res
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
      const nodefonyContainer = this.getContainer();
      if (container instanceof nodefonyContainer) {
        return true;
      }
      if (container.protoService && container.protoParameters) {
        return true;
      }
      return false;
    }
    return false;
  }

  getContainer(service= null){
    if (service){
      return service.container;
    }
    return Container(this).Container;
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
    let a = null;
    if (typeof Url === "string") {
      a = url.parse(Url);
    } else {
      a = Url;
    }
    let proto = null;
    if (a.protocol === "wss:" || a.protocol === "ws:") {
      if (a.protocol === "wss:") {
        proto = "https:"
      } else {
        proto = "http:"
      }
    } else {
      proto = a.protocol;
    }
    return a.hostname === loc.hostname &&
      a.port == loc.port &&
      proto === loc.protocol;
  }

  isSecure(Url = null) {
    let a = null;
    if (!url) {
      a = url.parse(window.location.href);
    } else {
      if (typeof Url === "string") {
        a = url.parse(Url);
      } else {
        a = Url;
      }
    }
    return a.protocol === "https:" || a.protocol === "wss:";
  }

}
export default Nodefony;
