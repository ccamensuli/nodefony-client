import bayeux from '../../protocols/bayeux/bayeux.es6';

export default (nodefony) => {
  nodefony.modules.push("socket");
  const defaultSettings = {
    type: "websocket",
    protocol: "bayeux",
    handshake: {
      method: "post",
      credentials: 'include',
      headers: {
        "Accept": 'application/json',
        "Content-Type": "application/json",
        "User-Agent": "nodefony-client"
      }
    }
  };
  const Bayeux = bayeux(nodefony);
  /*
   *
   */
  class Socket extends nodefony.Service {

    constructor(url = "/nodefony/socket", settings = defaultSettings, service = null) {
      if (!settings) {
        settings = defaultSettings;
      }
      if (service) {
        super("SOCKET", service.container, null, settings);
      } else {
        super("SOCKET", null, null, settings);
      }
      this.socket = null;
      this.services = null;
      this.subscribedService = {};
      this.nbSubscribed = 0;
      this.connected = false;
      this.publicAddress = null;
      this.domain = null;
      this.protocol = null;
      this.transport = null;
      this.crossDomain = false;
      switch (this.options.type) {
      case "websocket":
        this.transport = nodefony.WebSocket;
        break;
        /*case "poll":
          this.transport = nodefony.Poll;
          break;
        case "longPoll":
          this.transport = nodefony.LongPoll;
          break;*/
      default:
        this.transport = nodefony.WebSocket;
      }
      switch (this.options.protocol) {
      case "bayeux":
        this.initBayeux(this.options);
        break;
      default:
        this.initBayeux(this.options);
      }
      if (url) {
        this.handshake(url);
      }
    }

    initBayeux(options) {
      try {
        if (options.protocol instanceof nodefony.protocols.Bayeux) {
          this.protocol = options.protocol;
        } else {
          this.protocol = new nodefony.protocols.Bayeux(this, options, this);
        }
        this.protocol.on("onHandshake", (message, socket) => {
          this.fire("handshake", message, this);
        });
        this.protocol.on("onConnect", (message) => {
          this.services = message.data;
          this.connected = true;
          if (message.ext && message.ext.address) {
            const addr = message.ext.address;
            this.publicAddress = addr.remoteAddress;
            this.domain = addr.host;
          }
          this.fire("connect", message, this);
          this.fire("ready", message, this);
        });
        this.protocol.on("onDisconnect", (message) => {
          this.services = message.data;
          this.connected = false;
          this.fire("disconnect", message, this);
        });
        this.protocol.on("reConnect", (bayeux) => {
          setTimeout(() => {
            this.start();
          }, 60000);
        });
        this.protocol.on("onSubscribe", (message) => {
          const service = message.subscription.split("/")[2];
          this.subscribedService[service] = message;
          this.nbSubscribed++;
          this.fire("subscribe", service, message, this);
        });
        this.protocol.on("onUnsubscribe", (message) => {
          const service = message.subscription.split("/")[2];
          delete this.subscribedService[service];
          this.nbSubscribed--;
          this.fire("unsubscribe", service, message, this);
        });
        this.protocol.on("onError", (code, arg, message) => {
          this.fire("error", code, arg, message);
        });
        this.protocol.on("onClose", (message) => {
          this.connected = false;
          this.fire("close", message);
          for (var service in this.subscribedService) {
            //this.unSubscribe(service);
            delete this.subscribedService[service];
          }
        });
        this.protocol.on("onMessage", (service, message) => {
          let data = message.data;
          this.fire("message", service, data, this);
          this.fire(service, data, this);
        });
      } catch (e) {
        throw e;
      }
    }

    handshake(url, method = "post") {
      //fetch
      this.url = nodefony.url.parse(url);
      let opt = nodefony.extend(true, {
        method,
        body: this.protocol.handshake(),
        headers: {}
      }, this.options.handshake);
      const myHeaders = new Headers();
      if (this.options.handshake.headers) {
        for (let header in this.options.handshake.headers) {
          myHeaders.append(header, this.options.handshake.headers[header]);
        }
      }
      return fetch(this.url.href, opt)
        .then(async (response) => {
          try {
            if (response.ok) {
              return response.json();
            }
            let error = new Error(response.statusText);
            error.response = await response.json();
            throw error;
          } catch (error) {
            if (!error.response) {
              error.response = response;
            }
            throw error;
          }
        })
        .then(async (response) => {
          this.protocol.onMessage(response);
          const url = nodefony.url.format(response.ext.url);
          return this.connect(url, this.options);
        })
        .catch(async (error) => {
          this.log(error, "ERROR");
          throw error;
        });
    }

    connect(url, settings = null) {
      const options = settings ? settings : this.options;
      try {
        this.socket = new this.transport(url, options, this);
        this.socket.on("onopen", (event) => {
          this.fire("onopen", event, this)
        });
        this.socket.on("onmessage", (event) => {
          this.fire("onmessage", event, this)
        });
        this.socket.on("onerror", (event) => {
          this.fire("onerror", event, this)
        });
        this.socket.on("onclose", (event) => {
          this.fire("onclose", event, this)
        });
      } catch (e) {
        this.fire("onerror", e, this);
        throw e;
      }
      this.url = this.socket.url;
      this.crossDomain = !nodefony.isSameOrigin(this.url);
      return this.socket;
    }

    disconnect() {
      return this.protocol.disconnect();
    }

    start() {
      if (this.connected) {
        let error = new Error(`Connection already started`);
        this.fire("onerror", 500, error);
        return false;
      }
    }

    subscribe(name, data = null) {
      if (!this.connected) {
        const error = new Error(`Not connected`);
        this.fire('error', 500, error);
        return false;
      }
      if (name in this.services) {
        if (name in this.subscribedService) {
          const error = new Error(`Already subscribed`);
          this.fire('onerror', 500, "already subscribed");
          return false;
        }
        return this.protocol.subscribe(name, data);
      }
      const error = new Error(`service : ${name} not exist`);
      this.fire('onerror', 500, error);
      return false;
    }

    unSubscribe(name, data) {
      if (!this.connected) {
        const error = new Error(`Not connected`);
        this.fire('onerror', 500, error);
        return false;
      }
      if (name in this.services) {
        if (name in this.subscribedService) {
          var clientId = this.subscribedService[name].clientId;
          return this.protocol.unSubscribe(name, clientId, data);
        } else {
          const error = new Error(`Service :${name} not subcribed`);
          this.fire('onerror', 500, error);
          return false;
        }
      }
      const error = new Error(`Service : ${name} not exist`);
      this.fire('onerror', 404, error);
      return false;
    }

    close(code = 1000, reason = "ok") {
      return this.socket.close(code, reason);
    }

    send(data) {
      return this.socket.send(data);
    }

    destroy() {
      delete this.socket;
      this.socket = null;
      if (this.socket) {
        this.socket.destroy();
      }
      delete this.transport;
      this.transport = null;
      this.removeAllListeners();
    }
  }

  return nodefony.Socket = Socket;
};
