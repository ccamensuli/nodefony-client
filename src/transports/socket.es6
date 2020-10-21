import Bayeux from '../protocols/bayeux/bayeux.es6';


const defaultSettings = {
  type: "websocket", //   websocket | poll | longPoll
  protocol: "bayeux"
};

//const getDependencies = function () {
//  return import( /* webpackPreload: true , webpackChunkName: "bayeux" */ '../protocols/bayeux/bayeux.es6')
//    .then((bayeux) => {
//      return bayeux.default(nodefony);
//    });
//}();

/*
 *
 */
class Socket extends nodefony.Service {

  constructor(url, settings = defaultSettings, service = null) {
    if (settings === null) {
      settings = defaultSettings;
    }
    if (service) {
      super("Socket", service.container, null, settings);
      this.socket = null;
    } else {
      super("Socket", null, null, settings);
      this.socket = null;
    }
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
    case "poll":
      this.transport = nodefony.Poll;
      break;
    case "longPoll":
      this.transport = nodefony.LongPoll;
      break;
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
      this.connect(url, this.options);
    }
  }

  initBayeux(options) {
    try {
      if (options.protocol instanceof nodefony.protocols.Bayeux) {
        this.protocol = options.protocol
      } else {
        this.protocol = new nodefony.protocols.Bayeux(this, options, this);
      }
      this.protocol.on("onMessage", (message) => {
        if (message.error) {
          if (message.channel) {
            this.fire("onerror", message.error);
          } else {
            this.fire("onerror", message.id, message.successful);
          }
        } else {
          if (message.channel) {
            this.fire("onmessage", message.channel.split("/")[2], message.data);
          } else {
            this.fire("oneessage", message.id, message.successful);
          }
        }
      });
      this.protocol.on("onHandshake", (message, socket) => {
        if (message.ext && message.ext.address) {
          const addr = JSON.parse(message.ext.address);
          this.publicAddress = addr.remoteAddress;
          this.domain = addr.host;
        }
        this.fire("onHandshake", message, socket, this);
      });
      this.protocol.on("onConnect", (message) => {
        this.services = message.data;
        this.connected = true;
        if (message.ext && message.ext.address) {
          const addr = JSON.parse(message.ext.address);
          this.publicAddress = addr.remoteAddress;
          this.domain = addr.host;
        }
        this.fire("onConnect", message, this);
      });
      this.protocol.on("onDisconnect", (message) => {
        this.services = message.data;
        this.connected = false;
        this.fire("onDisconnect", message, this);
      });
      this.protocol.on("reConnect", (bayeux) => {
        setTimeout(() => {
          this.start();
        }, 60000);
      });
      this.protocol.on("onSubscribe", (message) => {
        var service = message.subscription.split("/")[2];
        this.subscribedService[service] = message;
        this.nbSubscribed++;
        this.fire("onSubscribe", service, message, this);
      });
      this.protocol.on("onUnsubscribe", (message) => {
        var service = message.subscription.split("/")[2];
        delete this.subscribedService[service];
        this.nbSubscribed--;
        this.fire("onUnSubscribe", service, message, this);
      });
      this.protocol.on("onError", (code, arg, message) => {
        this.fire("onerror", code, arg, message);
      });
      this.protocol.on("onClose", (message) => {
        this.connected = false;
        this.fire("onClose", message);
        for (var service in this.subscribedService) {
          //this.unSubscribe(service);
          delete this.subscribedService[service];
        }
      });
      this.on("onopen", () => {
        this.protocol.handshake(this.url.href);
      });
    } catch (e) {
      throw e;
    }
  }

  connect(url, settings = null) {
    let options = settings ? settings : this.options;
    //this.url = nodefony.urlToOject(url);
    this.url = nodefony.url(url);
    this.crossDomain = !nodefony.isSameOrigin(url);
    try {
      this.socket = new this.transport(url, options, this);
    } catch (e) {
      this.fire("onError", e);
      throw e;
    }
    this.socket.onmessage = this.listen(this, "onmessage");
    this.socket.onerror = this.listen(this, "onerror");
    this.socket.onopen = this.listen(this, "onopen");
    this.socket.onclose = this.listen(this, "onclose");
    return this.socket;
  }

  start() {
    if (this.connected) {
      let error = new Error(`Connection already started`);
      this.fire("onerror", 500, error);
      return false;
    }
  }

  subscribe(name, data) {
    if (!this.connected) {
      const error = new Error(`Not connected`);
      this.fire('onerror', 500, error);
      return false;
    }
    if (name in this.services) {
      if (name in this.subscribedService) {
        const error = new Error(`Already subscribed`);
        this.fire('onerror', 500, "already subscribed");
        return false;
      }
      return this.send(this.protocol.subscribe(name, data));
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
        return this.send(this.protocol.unSubscribe(name, clientId, data));
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

  close(code = 1000, reason) {
    return this.socket.close(code, reason);
  }

  send(data) {
    return this.socket.send(data);
  }

  destroy(data) {
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

export default Socket;
