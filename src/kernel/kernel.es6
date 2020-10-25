'use strict';
import browser from '../core/browser.es6';
import url from 'url';
import util from "util";
import {
  v4 as uuid
} from 'uuid';

export default (nodefony) => {

  const defaultOptions = {
    environment : "production",
    debug : false,
    loadEvent: "load", //"DOMContentLoaded"
  }

  class Kernel extends nodefony.Service {
    constructor(options) {
      super("kernel", null, null, nodefony.extend(true, {}, defaultOptions, options) );
      this.set("kernel", this);
      this.initSyslog();
      this.environment = this.options.environment;
      this.debug = this.options.debug;
      this.browser = browser;
      this.url = url;
      this.util = util;
      this.uuid = uuid;
      window.addEventListener(this.options.loadEvent, (event) => {
        this.log(`EVENT : ${this.options.loadEvent} `,"INFO");
        this.emit("load", event, this);
      });

    }

    createApi(baseUrl, option = {}){
      return new nodefony.Api()
    }

  }
  nodefony.Kernel = Kernel;
  return Kernel;

};
