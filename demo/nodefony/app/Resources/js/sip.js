/*
 *
 *	ENTRY POINT
 *  WEBPACK bundle app
 *  client side
 */
import "../css/sip.css";

// dev
import Nodefony from "../../../../../src/nodefony.js";
//console.log(process.env.NODE_ENV)
const nodefony = new Nodefony(process.env.NODE_ENV, process.env.NODE_DEBUG);
import Socket from "../../../../../src/transports/socket/socket.js";
Socket(nodefony);
import Webaudio from "../../../../../src/medias/webaudio/webaudio.js";
Webaudio(nodefony);
import Sip from "../../../../../src/protocols/sip/sip.js";
Sip(nodefony);
window.nodefony = nodefony;
/*
 *	Class Bundle App
 */
class App extends nodefony.Kernel {
  constructor() {
    super("App", {
      environment: process.env.NODE_ENV || "production",
      debug: process.env.NODE_DEBUG || false
    });
    this.server = "nodefony.com";
    this.on("load", () => {
      this.initialize();
    });
  }

  initialize() {
    //this.createSipWebSocket("1001", "1001");
    //this.createSipSocket("1003", "1003", "TCP");
    this.createSipSocket("1002", "1002", "UDP");
    //this.createSipWebSocket("5021", "1234", "wss://pbx.example.com");
    //this.createSipSocket("5015", "5015", "UDP");
    //this.createSipSocket("5015", "5015", "TCP");
  }

  createSipWebSocket(user, password, domain = "wss://localhost", port="8089") {
    const url = `${domain}:${port}/ws`;
    //const url = `ws://localhost:8090/ws`;
    //const url = `wss://pbx.example.com:8089/ws`;
    //const url = `ws://pbx.example.com:8088/ws`;
    const transport = new nodefony.WebSocket(url, {
      protocol: "sip"
    }, this);
    this.log(transport, "DEBUG")
    transport.on("onerror", (event, code, reason) => {
      this.log(`Websocket Error code : ${code||null} ==> ${reason}`, "ERROR");
    });
    transport.on("onclose", (event, code, reason) => {
      this.log(`Websocket Close code : ${code} => ${reason}`, "WARNING");
    });
    this.initializeSip(user, password, transport);
  }

  createSipSocket(user, password, type) {
    const socket = new nodefony.Socket(`/nodefony/socket`, null, this);
    const sip = this.initializeSip(user, password, socket, type);
    socket.on("ready", (message, socket) => {
      socket.subscribe("sip");
    });
    socket.on("error", (code, args, message) => {
      socket.log(message, "ERROR");
    });
    this.log(socket, "DEBUG");
    return socket;
  }

  initializeSip(user, passwd, transport, type = null) {
    const sip = new nodefony.protocols.Sip(this.server, transport, {
      transport: type
    }, this);
    sip.on("onConnect", () => {
      sip.register(user, passwd);
    });
    sip.on("onRegister", () => {
      this.log(`Register User ${user} asterisk`);
    });
    this.log(sip, "DEBUG")
    return sip;
  }
}

/*
 * HMR
 */
if (module.hot) {
  module.hot.accept((err) => {
    if (err) {
      console.error('Cannot apply HMR update.', err);
    }
  });
}
export default new App();
