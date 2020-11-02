'use strict';
import browser from '../core/browser.es6';
import url from 'url';
import util from "util";
import {
  v4 as uuid
} from 'uuid';

export default (nodefony) => {

  const defaultOptions = {
    environment: nodefony.environment || "production",
    debug: nodefony.debug,
    version: "1.0.0",
    loadEvent: "load", //"DOMContentLoaded"
  }

  class Kernel extends nodefony.Service {
    constructor(options) {
      super("KERNEL", null, null, nodefony.extend(true, {}, defaultOptions, options));
      this.set("kernel", this);
      this.environment = this.options.environment;
      this.version = this.options.version;
      this.debug = this.options.debug;
      this.initSyslog(this.environment, this.debug);
      this.browser = browser;
      this.url = url;
      this.util = util;
      this.uuid = uuid;
      window.addEventListener(this.options.loadEvent, (event) => {
        this.showBanner();
        this.log(`EVENT ${this.options.loadEvent} `, "DEBUG");
        this.emit("load", event, this);
      });
    }

    showBanner() {
      this.logger(`\tAPPLICATION-KERNEL\n\n`,
        `\tVersion :\t\t\t ${this.version}\n`,
        `\tenvironment :\t\t ${this.environment}\n`,
        `\tdebug :\t\t\t\t`,
        this.debug,
        `\n\n\n`
      );
    }

    createApi(baseUrl, option = {}) {
      return new nodefony.Api()
    }

  }
  return Kernel;
};
