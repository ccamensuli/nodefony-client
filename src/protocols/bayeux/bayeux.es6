export default (nodefony) => {
  
  'use strict';

  const clientsCapabilities = function() {
    let tab = [];
    let ws = nodefony.nativeWebSocket ? tab.push("websocket") : null;
    let poll = nodefony.Poll ? tab.push("poll") : null;
    let lpoll = nodefony.LongPoll ? tab.push("long-polling") : null;
    let jsonp = nodefony.Jsonp ? tab.push("callback-polling") : null;
    return tab;
  }();

  const onHandshakeResponse = function(message) {
    if (message.successful) {
      try {
        if (!this.socket) {
          //let socket = this.getBestConnection(message.supportedConnectionTypes);
          this.socket = new nodefony.Socket(this.url, {
            protocol: this
          });
          this.socket.on("onopen", () => {
            this.socket.send(this.connect(message));
            this.fire("onHandshake", message, this.socket);
          });
        }
        this.socket.on("onmessage", (message) => {
          if (message.data) {
            this.onMessage(message.data);
          }
        });
        this.socket.on("onerror", this.listen(this, "onError"));
        this.socket.on("onclose", (err) => {
          delete this.socket;
          this.fire("onClose", err);
        });
      } catch (e) {
        throw new Error(e);
      }
    } else {
      onError.call(this, message);
    }
  };

  const reconnect = function() {
    this.reconnect = true;
    this.fire("reConnect", this);
  };

  const onConnectResponse = function(message) {
    if (message.successful) {
      this.connected = true;
      this.idconnection = message.clientId;
      if (message.advice) {
        for (let ele in message.advice) {
          switch (ele) {
            case "reconnect":
              if (message.advice[ele] === "retry") {
                if (!this.reconnect) {
                  this.on("onClose", reconnect);
                }
              }
              break;
          }
        }
      }
      this.fire("onConnect", message);
    } else {
      this.connected = false;
      onError.call(this, message);
    }
  };

  const onDisconnectResponse = function(message) {
    if (message.successful) {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        this.fire("onDisconnect", message);
      }
    } else {
      onError.call(this, message);
    }
  };

  const onSubscribeResponse = function(message) {
    if (message.successful) {
      this.fire("onSubscribe", message);
    } else {
      onError.call(this, message);
    }
  };

  const onUnsubscribeResponse = function(message) {
    if (message.successful) {
      this.fire("onUnsubscribe", message);
    } else {
      onError.call(this, message);
    }
  };

  const onError = function(message) {
    if (message.error) {
      let code = null;
      let arg = null;
      let mess = null;
      try {
        switch (nodefony.typeOf(message.error)) {
          case "string":
            let res = message.error.split(":");
            code = res[0];
            arg = res[1];
            mess = res[2];
            break;
          case "object":
            if (message.error) {
              return onError.call(this, message.error);
            }
            break;
          case "Error":
            message.error = "500::" + message.error.message;
            return onError.call(this, message.error);
          default:
            throw new Error("Bad protocole error BAYEUX");
        }
        return this.fire("onError", code, arg, mess);
      } catch (e) {
        throw e;
      }
    }
  };

  /*
   *	BAYEUX PROTOCOL
   *
   */
  class Bayeux extends nodefony.Service {

    constructor(url, settings = {}, service = null) {
      if (service) {
        super("bayeux", service.container, service.notificationCenter, settings);
      } else {
        super("bayeux", null, null, settings);
      }
      if (url instanceof nodefony.Socket) {
        this.socket = url;
        this.socket.on("onopen", (message) => {
          this.socket.send(this.connect(message));
          this.fire("onHandshake", message, this.socket);
        });
      } else {
        this.url = url;
      }
      this.connected = false;
      this.request = {
        version: "1.0"
      };
    }

    build(obj) {
      let res = [];
      res.push(obj);
      return res;
    }

    handshake() {
      let req = JSON.stringify(nodefony.extend({}, this.request, {
        channel: "/meta/handshake",
        minimumVersion: "1.0",
        supportedConnectionTypes: clientsCapabilities
      }));
      return this.send(req);
    }

    connect(message) {
      return JSON.stringify({
        channel: "/meta/connect",
        clientId: message.clientId,
        connectionType: this.socketType
      });
    }

    stopReConnect() {
      this.unListen("onClose", reconnect);
    }

    disconnect() {
      return JSON.stringify({
        channel: "/meta/disconnect",
        clientId: this.idconnection,
      });
    }

    subscribe(name, data) {
      return JSON.stringify({
        channel: "/meta/subscribe",
        clientId: this.idconnection,
        subscription: "/service/" + name,
        data: data
      });
    }

    unSubscribe(name, clientId, data) {
      return JSON.stringify({
        channel: "/meta/unsubscribe",
        clientId: clientId,
        subscription: "/service/" + name,
        data: data
      });
    }

    sendMessage(service, data, clientId) {
      return JSON.stringify({
        channel: "/service/" + service,
        clientId: clientId,
        id: new Date().getTime(),
        data: data
      });
    }

    onMessage(message) {
      try {
        if (typeof message === "string") {
          message = JSON.parse(message);
        }
      } catch (e) {
        message.error = e;
        onError.call(this, message);
        return;
      }
      switch (message.channel) {
        case "/meta/handshake":
          return onHandshakeResponse.call(this, message);
        case "/meta/connect":
          return onConnectResponse.call(this, message);
        case "/meta/disconnect":
          return onDisconnectResponse.call(this, message);
        case "/meta/subscribe":
          return onSubscribeResponse.call(this, message);
        case "/meta/unsubscribe":
          return onUnsubscribeResponse.call(this, message);
        default:
          // /some/channel
          this.fire("onMessage", message);
      }
    }

    send(data) {
      if (this.socket) {
        return this.socket.send(data);
      }
    }
  }

  nodefony.protocols.Bayeux = Bayeux;
  return Bayeux;
};
