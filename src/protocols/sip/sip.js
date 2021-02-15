import dialog from './dialog.js';
import authenticate from './authenticate/authenticate.js';
import sipMessage from './sipmessage.js';
import error from './siperror.js';

export default (nodefony) => {
  'use strict';
  nodefony.modules.push("sip");
  const Dialog = dialog(nodefony);
  const Authenticate = authenticate(nodefony);
  const SipMessage = sipMessage(nodefony);
  const sipError = error(nodefony);

  const defaultSettings = {
    expires: 200, // en secondes
    maxForward: 70,
    version: "SIP/2.0",
    userAgent: "nodefony",
    portServer: "5060",
    userName: "userName",
    displayName: "",
    pwd: "password",
    transport: "WSS" //"TCP" "UDP" for nodefony socket
  };

  const onMessage = function (response) {
    this.log(`RECEIVE\n${response}`, "DEBUG");
    let message = null;
    let res = null;
    try {
      //console.log(this.fragment)
      if (this.fragment) {
        this.lastResponse += response;
        //console.log(this.lastResponse);
      } else {
        this.lastResponse = response;
      }
      message = new SipMessage(this.lastResponse, this);
      this.fragment = false;
    } catch (e) {
      //console.trace(e);
      // bad split
      for (let i = 0; i < e.length; i++) {
        if (e[i]) {
          try {
            onMessage.call(this, e[i]);
            continue;
          } catch (e) {
            //console.log("FRAGMENTE")
            this.fragment = true;
            return;
          }
        }
      }
      this.log(e, "WARNING");
      if(!response){
        this.log("SIP DROP : message empty ", "WARNING");
      }else{
        this.log("SIP DROP message: " + response, "WARNING");
      }
      this.fire("onDrop", response);
      return;
    }
    this.fire("onMessage", message.rawMessage);
    switch (message.method) {
    case "REGISTER":
      this.rport = message.header.Via[0].rport;
      if (message.dialog) {
        this.clearDialogTimeout(message.dialog);
      }
      if (this.rport) {
        this["request-uri"] = "sip:" + this.userName + "@" + this.publicAddress + ":" + this.rport + ";transport=" + this.transportType;
      }
      switch (message.code) {
      case 401:
      case 407:
        if (this.registered === 200) {
          if (this.registerInterval) {
            clearInterval(this.registerInterval);
          }
          this.registerInterval = null;
        } else {

          if (this.registered === 401 || this.registered === 407) {
            if (this.registerInterval) {
              clearInterval(this.registerInterval);
            }
            this.registerInterval = null;
            this.registered = null;
            this.fire("onError", this, message);
            break;
          }
          this.registered = message.code;
        }
        delete this.authenticateRegister;
        this.authenticateRegister = null;
        this.authenticateRegister = new Authenticate(message.dialog, this.userName, this.settings.password);
        this.authenticateRegister.register(message, message.code === 407 ? "proxy" : null);
        break;
      case 403:
        if (this.registerInterval) {
          clearInterval(this.registerInterval);
        }
        this.registered = message.code;
        //console.log("Forbidden (bad auth)")
        delete this.authenticateRegister;
        this.authenticateRegister = null;
        this.fire("onError", this, message);
        break;
      case 404:
        if (this.registerInterval) {
          clearInterval(this.registerInterval);
        }
        this.registered = message.code;
        delete this.authenticateRegister;
        this.authenticateRegister = null;
        this.fire("onError", this, message);
        break;
      case 200:
        if (this.registerInterval) {
          clearInterval(this.registerInterval);
        }
        if (this.authenticateRegister && this.authenticateRegister.unregisterSended) {
          this.registered = "404";
          this.fire("onUnRegister", this, message);
          this.clear();
          return;
        }
        if (message.dialog.unregisterSended) {
          this.registered = "404";
          this.fire("onUnRegister", this, message);
          this.clear();
          return;
        }
        if (this.registered === 401 || this.registered === null) {
          this.fire("onRegister", this, message);
        }
        this.registered = message.code;

        let expires = message.header["contact-expires"] || this.settings.expires;
        expires = parseInt(expires, 10) * 900; // 10% (ms)
        this.registerInterval = setInterval(() => {
          if (!this.authenticateRegister) {
            this.diagRegister.register();
          } else {
            this.authenticateRegister.register(message);
          }
          this.fire("onRenew", this, this.authenticateRegister, message);
        }, expires);
        break;
      default:
        this.registered = message.code;
        delete this.authenticateRegister;
        this.authenticateRegister = null;
        //console.log(message);
        this.fire("on" + message.code, this, message);
        break;
      }
      break;
    case "INVITE":
      //this.rport = message.rport || this.rport;
      if (message.dialog) {
        this.clearDialogTimeout(message.dialog);
      }
      switch (message.type) {
      case "REQUEST":
        if (message.dialog.status === message.dialog.statusCode.INITIAL) {
          this.fire("onInitCall", message.dialog.toName, message.dialog, message.transaction);
          if (message.header.Via) {
            message.dialog.Via = message.header.Via;
          }
          this.fire("onInvite", message, message.dialog);
        } else {
          //console.log(message.dialog.statusCode[message.dialog.status])
          if (message.dialog.status === message.dialog.statusCode.ESTABLISHED) {
            this.fire("onInvite", message, message.dialog);
          } else {
            let ret = message.transaction.createResponse(200, "OK");
            ret.send();
          }
        }
        break;
      case "RESPONSE":
        if (message.code >= 200) {
          message.dialog.ack(message);
        }
        switch (message.code) {
        case 407:
        case 401:
          delete this.authenticate;
          this.authenticate = null;
          this.authenticate = new Authenticate(message.dialog, this.userName, this.settings.password);
          let transaction = this.authenticate.register(message, message.code === 407 ? "proxy" : null);
          this.fire("onInitCall", message.dialog.toName, message.dialog, transaction);
          break;
        case 180:
          this.fire("onRinging", this, message);
          message.dialog.status = message.dialog.statusCode.EARLY;
          break;
        case 100:
          this.fire("onTrying", this, message);
          message.dialog.status = message.dialog.statusCode.EARLY;
          break;
        case 200:
          this.fire("onCall", message);
          message.dialog.status = message.dialog.statusCode.ESTABLISHED;
          break;
        case 486:
        case 603:
          this.fire("onDecline", message);
          break;
        case 403:
          this.authenticate = false;
          this.fire("onError", this, message);
          break;
        case 487:
        case 404:
        case 481:
        case 477:
        case 480:
        case 484:
        case 488:
          this.fire("onError", this, message);
          break;
        case 408:
          this.fire("onTimeout", this, message);
          break;
        case 500:
          this.fire("onError", this, message);
          break;
        case 503:
          this.fire("onError", this, message);
          break;
        default:
          this.fire("on" + message.code, this, message);
          break;
        }
        break;
      default:
        // error BAD FORMAT
      }
      break;
    case "ACK":
      //TODO manage interval messages timer retransmission
      break;
    case "BYE":
      switch (message.code) {
      case 200:
        this.fire("onBye", message);
        break;
      default:
        this.fire("onBye", message);
        if (message.type === "REQUEST") {
          res = message.transaction.createResponse(200, "OK");
          res.send();
        }
      }
      break;
    case "INFO":
      switch (message.type) {
      case "REQUEST":
        //console.log("SIP   :"+ message.method + " "+" type: "+message.contentType );
        this.fire("onInfo", message);
        res = message.transaction.createResponse(200, "OK");
        res.send();
        break;
      case "RESPONSE":
        //console.log("SIP   :"+ message.method + " "+" code:"+message.code );
        this.log(`SIP RESPONSE NOT ALLOWED : ${message.method} code : ${message.code}`, "WARNING");
        this.fire("onDrop", message);
        break;
      }
      break;
    case "CANCEL":
      switch (message.type) {
      case "REQUEST":
        this.fire("onCancel", message);
        res = message.transaction.createResponse(200, "OK");
        res.send();
        message.dialog.status = message.dialog.statusCode.CANCEL;
        res = message.transaction.createResponse(487, "Request Terminated");
        res.send();
        message.dialog.status = message.dialog.statusCode.TERMINATED;
        break;
      case "RESPONSE":
        this.fire("onDrop", message);
        break;
      }
      break;
    case "REFER":
      // transfers d'appel et conférence
      this.log("SIP REFER NOT ALLOWED :" + message.method, "WARNING");
      this.fire("onDrop", message);
      break;
    case "UPDATE":
      switch (message.type) {
        case "REQUEST":
        this.fire("onUpdate", message);
        res = message.transaction.createResponse(200, "OK");
        res.send();
        break;
        case "RESPONSE":
        this.fire("onDrop", message);
        break;
      }
      break;
    default:
      this.log("SIP DROP message :" + message.method + " " + " code:" + message.code, "WARNING");
      this.fire("onDrop", message);
      // TODO RESPONSE WITH METHOD NOT ALLOWED
    }
  };

  class Sip extends nodefony.Service {
    constructor(server, transport, settings, service = null) {
      super("SIP", (service ? service.container : null), null, nodefony.extend({}, defaultSettings, settings));
      this.settings = this.options // nodefony.extend({}, defaultSettings, settings);
      this.dialogs = {};
      this.version = this.settings.version;
      //server
      this.server = server || "127.0.0.1";
      this.serverPort = this.settings.portServer;
      this.publicAddress = this.server;

      // authenticate
      this.authenticate = false;
      this.authenticateRegister = null;

      // REGISTER
      this.registerInterval = null;
      this.registerTimeout = {};
      this.registered = null;
      this.diagRegister = null;

      // TRANSPORT
      this.transport = transport;
      if (this.transport) {
        this.initTransport();
      }
      this.contact = null;
      this.via = null;
    }

    static SipMessage(){
      return SipMessage;
    };

    generateInvalid() {
      return parseInt(Math.random() * 1000000000, 10) + ".nodefony.invalid";
    }

    generateVia(addr) {
      let transportType = this.transportType.toUpperCase();
      if (this.rport) {
        return this.version + "/" + transportType + " " + addr + ";rport";
      } else {
        return this.version + "/" + transportType + " " + addr;
      }
    }

    generateContact(userName, password, force, settings) {
      if (userName) {
        this.userName = userName;
        if (settings && settings.displayName) {
          this.displayName = settings.displayName;
        } else {
          this.displayName = userName;
        }
        this.from = '"' + this.displayName + '"' + '<sip:' + this.userName + '@' + this.publicAddress + '>';
        this["request-uri"] = "sip:" + this.userName + "@" + this.publicAddress + ";transport=" + this.transportType;
        if (password) {
          this.settings.password = password;
        }
      }
      if (!this.contact || force) {
        var invalid = null;
        switch (this.transportType) {
        case "ws":
        case "wss":
          invalid = this.generateInvalid();
          this.via = this.generateVia(invalid);
          let str = "";
          if (this.rport) {
            str = `"${this.displayName}" <sip:${this.userName}@${invalid}:${this.rport};transport="${this.transportType}">`;
            //return '"' + this.displayName + '"' + "<sip:" + this.userName + "@" + invalid + ":" + this.rport + ";transport=" + this.transportType + ">";
            return str;
          } else {
            str = `"${this.displayName}" <sip:${this.userName}@${invalid};transport="${this.transportType}">`;
            //return '"' + this.displayName + '"' + "<sip:" + this.userName + "@" + invalid + ";transport=" + this.transportType + ">";
            return str ;
          }
          break;
        case "tcp":
        case "udp":
          invalid = this.generateInvalid();
          this.via = this.generateVia(invalid);
          //this.via = this.generateVia(this.publicAddress);
          if (this.rport) {
            return '"' + this.displayName + '"' + "<sip:" + this.userName + "@" + invalid + ":" + this.rport + ";transport=" + this.transportType + ">";
          } else {
            return '"' + this.displayName + '"' + "<sip:" + this.userName + "@" + invalid + ";transport=" + this.transportType + ">";
          }
          break;
        default:
          throw new Error("SIP TRANSPORT TYPE NOT ALLOWED");
        }
      }
      return this.contact;
    }

    getDialog(id) {
      if (id in this.dialogs) {
        return this.dialogs[id];
      }
      return null;
    }

    initTransport(transport) {
      if (transport) {
        this.transport = transport;
      }
      // GET REMOTE IP
      if (this.transport.publicAddress) {
        //this.publicAddress = this.transport.domain.hostname;
        this.transportType = this.settings.transport.toLowerCase();
      } else {
        if (this.transport.url && this.transport.url.protocol) {
          this.transportType = this.transport.url.protocol.replace(/:/, "");
        } else {
          this.transportType = this.settings.transport.toLowerCase();
        }
      }
      switch (this.transportType) {
        // realtime nodefony
      case "tcp":
      case "udp":
        this.transport.on("subscribe", (service, message) => {
          if (service === "sip") {
            this.serviceName = service;
            this.clientId = message.clientId;
            this.connect(message);
          }
        });
        this.transport.on("unsubscribe", (service, message) => {
          if (service === "sip" ) {
            this.unregister();
            this.serviceName = null;
            this.clientId = null;
          }
        });
        this.transport.on("sip", ( message) => {
            onMessage.call(this, message);
        });
        this.transport.on("close", (message) => {
            this.quit(message);
        });
        this.send = (data)=>{
          let message = this.transport.protocol.sendMessage(this.serviceName, data, this.clientId)
          this.log(`SEND\n${data}`, "DEBUG");
          this.fire("onSend", data);
          this.transport.send(message);
        };
        break;
      case "ws":
      case "wss":
        this.transport.listen(this, "onmessage", function (message) {
          onMessage.call(this, message.data);
        });
        this.transport.listen(this, "onerror", function (message) {
          this.fire("onError", this.transport, message);
        });
        this.transport.listen(this, "onopen", function (message) {
          this.connect(message);
        });
        this.transport.listen(this, "onclose", function (message) {
          this.quit(message);
        });
        break;
      default:
        this.fire("onError", new Error("TRANSPORT LAYER NOT DEFINED"));
      }
    }

    clear() {
      if (this.registerInterval) {
        clearInterval(this.registerInterval);
      }
      if (this.registerTimeout) {
        this.clearDialogTimeout();
        delete this.registerTimeout;
      }
      //clean all setinterval
      for (var dia in this.dialogs) {
        //this.dialogs[dia].unregister();
        this.dialogs[dia].clear();
      }
      this.removeAllListeners();
    }

    quit(message) {
      this.fire("onQuit", this, message);
      //this.unregister();
      this.clear();
    }

    connect(message) {
      this.fire("onConnect", this, message);
    }

    createDialog(method) {
      var dialog = new Dialog(method, this);
      this.log("SIP NEW DIALOG :" + dialog.callId, "DEBUG");
      this.dialogs[dialog.callId] = dialog;
      return dialog;
    }

    createDialogTimeout(dialog) {
      if (dialog) {
        this.registerTimeout[dialog.callId] = setTimeout(() => {
          let error = new Error(" DIALOG ID : " + dialog.callId + " TIMEOUT : " + dialog.method + "  no response ");
          this.log(error, "ERROR");
          this.fire("onError", this, error);
        }, (parseInt(this.settings.expires, 10) * 900));
      }
    }
    clearDialogTimeout(dialog) {
      if (dialog) {
        let id = dialog.callId;
        if (this.registerTimeout[id]) {
          clearTimeout(this.registerTimeout[id]);
          delete this.registerTimeout[id];
        }
      } else {
        for (let ele in this.registerTimeout) {
          clearTimeout(this.registerTimeout[ele]);
          delete this.registerTimeout[ele];
        }
      }
    }

    register(userName, password, settings) {
      this.log("TRY TO REGISTER SIP : " + userName + password, "DEBUG");
      this.contact = this.generateContact(userName, password, false, settings);
      this.diagRegister = this.createDialog("REGISTER");
      this.diagRegister.register();
      this.createDialogTimeout(this.diagRegister);
      return this.diagRegister;
    }

    unregister() {
      if (this.authenticateRegister && this.registered === 200) {
        return this.authenticateRegister.unregister();
      }
      if (this.diagRegister && this.registered === 200) {
        return this.diagRegister.unregister();
      }
    }

    invite(userTo, description) {
      var diagInv = this.createDialog("INVITE");
      var transaction = diagInv.invite(userTo + "@" + this.publicAddress, description);
      diagInv.toName = userTo;
      //this.fire("onInitCall", userTo, diagInv, transaction);
      return diagInv;
    }

    notify(userTo, description, type) {
      var diagNotify = this.createDialog("NOTIFY");
      diagNotify.notify(userTo + "@" + this.publicAddress, description, type);
      return diagNotify;
    }

    send(data) {
      this.log(`SEND\n${data}`, "DEBUG");
      this.fire("onSend", data);
      this.transport.send(data);
    }

    bye(callId) {
      for (let dialog in this.dialogs) {
        if (callId) {
          if (this.dialogs[dialog].callId === callId && this.dialogs[dialog].method !== "REGISTER" && this.dialogs[dialog].status === this.dialogs[dialog].statusCode.ESTABLISHED) {
            this.dialogs[dialog].bye();
            break;
          }
        } else {
          this.dialogs[dialog].bye();
        }
      }
    }
  }

  return nodefony.protocols.Sip = Sip;

};
