export default (nodefony) => {

  const defaultStorage = {
    storage: {
      type: "session", // local
      tokenName: "token",
      refreshTokenNane: "refresh-token"
    }
  };

  class Storage extends nodefony.Service {
    constructor(name, options = {}, service = null) {
      if (service) {
        super(name, service.container, false, nodefony.extend(true, {}, defaultStorage, options));
      } else {
        super(name, null, false, nodefony.extend(true, {}, defaultStorage, options));
      }
      if (this.options.storage.type === "local") {
        this.storage = window.localStorage;
      } else {
        this.storage = window.sessionStorage;
      }
      if (this.name) {
        this.tokenName = `${this.name}-${this.options.storage.tokenName}`;
        this.refreshTokenNane = `${this.name}-${this.options.storage.refreshTokenNane}`;
      } else {
        this.tokenName = `${this.options.storage.tokenName}`;
        this.refreshTokenNane = `${this.options.storage.refreshTokenNane}`;
      }
    }

    get token() {
      return this.storage.getItem(this.tokenName) || null;
    }
    set token(value) {
      this.storage.setItem(this.tokenName, value);
    }

    get refreshToken() {
      return this.storage.getItem(this.refreshTokenNane) || null;
    }
    set refreshToken(value) {
      this.storage.setItem(this.refreshTokenNane, value);
    }

    clearToken(refresh = false) {
      if (refresh) {
        this.storage.removeItem(this.refreshTokenNane);
        delete this.refreshToken;
      }
      this.storage.removeItem(this.tokenName);
      delete this.token;
    }
  }
  return nodefony.Storage = Storage;
};
