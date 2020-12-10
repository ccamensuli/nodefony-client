export default (nodefony) => {

  const json = {
    configurable: true,
    writable: true,
    value: function() {
      let alt = {};
      const storeKey = function(key) {
        alt[key] = this[key];
      };
      Object.getOwnPropertyNames(this).forEach(storeKey, this);
      return alt;
    }
  };
  Object.defineProperty(Error.prototype, 'toJSON', json);

  const exclude = {
    context: true,
    resolver: true,
    container: true,
    secure: true
  };
  const jsonNodefony = {
    configurable: true,
    writable: true,
    value: function() {
      let alt = {};
      const storeKey = function(key) {
        if (key in exclude) {
          return;
        }
        alt[key] = this[key];
      };
      Object.getOwnPropertyNames(this).forEach(storeKey, this);
      return alt;
    }
  };

  class nodefonyError extends Error {

    constructor(message, code) {
      super(message);
      this.name = this.constructor.name;
      this.code = null;
      this.errorType = this.name;
      if (code) {
        this.code = code;
      }
      if (message) {
        this.parseMessage(message);
      }
    }


    parseMessage(message) {
      this.message = message;
    }

  }

  Object.defineProperty(nodefonyError.prototype, 'toJSON', jsonNodefony);
  return nodefonyError;
};
