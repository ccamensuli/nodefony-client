//import "core-js/stable";
//import "regenerator-runtime/runtime";

//import api from "./api/api.js";
//const version = require("../package.json").version;
import Package from '../package.json';
import isregexp from 'lodash.isregexp';
const nativeWebSocket = window.WebSocket ? true : false;
import querystring from 'querystring';
import url from 'url';
import {
  v4 as uuidv4
} from 'uuid';

class Nodefony {
  constructor(env) {
    this.version = Package.version;
    this.environment = env;
    //this.api = api;
    this.isRegExp = isregexp;
    this.medias = {};
    this.protocols = {};
    this.nativeWebSocket = nativeWebSocket;
    this.query = this.getQuery();

    /*window.addEventListener("load", () => {
      this.load();
    }, false);*/
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

  async load(obj = this.query) {
    for (let lib in obj) {
      if( lib === "medias" && obj[lib] ){
        console.debug(`Nodefony Preload module ${lib} `)
        await this.preloadMedias();
      }
      if(lib === "socket" && obj[lib]){
        console.debug(`Nodefony Preload module ${lib} `)
        await this.preloadSocket();
        break;
      }
    }
  }

  getUuid() {
    return uuidv4();
  }

  async prefetchMedias() {
    // medias
    await import( /* webpackPrefetch: true , webpackChunkName: "medias" */ './medias/medias.es6')
    .then((medias) => {
      return medias.default(this);
    });
    // medias webaudio
    await import( /* webpackPrefetch: true , webpackChunkName: "webAudio" */ './medias/webAudio/webAudio.es6')
    .then((audio) => {
      return audio.default(this);
    });
    await import( /* webpackPrefetch: true , webpackChunkName: "audioBus" */ './medias/webAudio/audioBus.es6')
    .then((audioBus) => {
      return audioBus.default(this);
    });
    await import( /* webpackPrefetch: true , webpackChunkName: "track" */ './medias/webAudio/track.es6')
    .then((track) => {
      return track.default(this);
    });
    await import( /* webpackPrefetch: true , webpackChunkName: "mixer"*/ './medias/webAudio/mixer.es6')
    .then((mixer) => {
      return mixer.default(this);
    });
  }

  async preloadMedias() {
    // medias
    let ret = await import( /* webpackPreload: true , webpackChunkName: "medias" */ './medias/medias.es6')
      .then((medias) => {
        return medias.default(this);
      });
    // medias webaudio
    await import( /* webpackPreload: true , webpackChunkName: "webAudio" */ './medias/webAudio/webAudio.es6')
    .then((audio) => {
      return audio.default(this);
    });
    await import( /* webpackPreload: true , webpackChunkName: "audioBus" */ './medias/webAudio/audioBus.es6')
    .then((audioBus) => {
      return audioBus.default(this);
    });
    await import( /* webpackPreload: true , webpackChunkName: "track" */ './medias/webAudio/track.es6')
    .then((track) => {
      return track.default(this);
    });
    await import( /* webpackPreload: true , webpackChunkName: "mixer"*/ './medias/webAudio/mixer.es6')
    .then((mixer) => {
      return mixer.default(this);
    });
    return ret;
  }

  async preloadSocket() {
    // socket
    return await import( /* webpackPreload: true , webpackChunkName: "socket" */ './transports/socket.es6')
      .then((socket) => {
        return socket.default(this);
      });
  }

  async prefetchSocket() {
    // socket
    return await import( /* webpackPrefetch: true , webpackChunkName: "socket" */ './transports/socket.es6')
      .then((socket) => {
        return socket.default(this);
      });
  }

  basename(path) {
    return path.replace(/\\/g, '/').replace(/.*\//, '');
  }

  dirname(path) {
    return path.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
  }

  url(href){
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

  isFunction(it) {
    return Object.prototype.toString.call(it) === '[object Function]';
  }

  isArray(it) {
    return Object.prototype.toString.call(it) === '[object Array]';
  }

  isContainer(container) {
    if (container && container.protoService && container.protoParameters) {
      return true;
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

  isSecure(Url) {
    const loc = window.location;
    const a = url.parse(Url);
    return a.protocol === "https:";
  }

}
export default new Nodefony(process.env.NODE_ENV);
