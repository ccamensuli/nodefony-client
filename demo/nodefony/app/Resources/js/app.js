/*
 *
 *	ENTRY POINT
 *  WEBPACK bundle app
 *  client side
 */
import "../css/app.css";
// with release production

/*import nodefony from "nodefony-client";
import media from "nodefony-client/dist/medias.js";
media(nodefony);
import webaudio from "nodefony-client/dist/webaudio";
webaudio(nodefony);
import socket from "nodefony-client/dist/socket";
socket(nodefony);
import sip from "nodefony-client/dist/sip";
sip(nodefony);*/

// dev
import Nodefony from "../../../../../src/nodefony.es6";
//console.log(process.env.NODE_ENV)
const nodefony = new Nodefony(process.env.NODE_ENV);
import Media from "../../../../../src/medias/medias.es6";
Media(nodefony);
//console.log(nodefony)
import Socket from "../../../../../src/transports/socket.es6";
Socket(nodefony);
import Webaudio from "../../../../../src/medias/webaudio/webaudio.es6";
Webaudio(nodefony);

import Sip from "../../../../../src/protocols/sip/sip.es6";
Sip(nodefony);
//console.log(nodefony)


/*
 *	Class Bundle App
 */
class App extends nodefony.Kernel {
  constructor() {
    super({});
    this.on("load", () => {
      this.initialize();
    });
    this.log("LOG DEMO INFO", "INFO");
    this.log("LOG DEMO ERROR", "ERROR");
    this.log("LOG DEMO WARNING", "WARNING");
    this.log("LOG DEMO DEBUG", "DEBUG");
    let error = new Error("my error");
    this.log(error, "ERROR");

  }

  async initialize() {
    //this.createMixer();
    //await this.createMediaStream();
    //this.createWebsocket();
    this.createSocket();
    //this.initializeApi();
    //this.login();
    //this.createSip();
  }

  initializeApi() {
    this.api = new nodefony.Api("api", "/", {}, this);
    this.api2 = new nodefony.Api("api2", "https://localhost:5152/api/", {
      storage: {
        type: "local"
      }
    }, this);
  }

  login() {
    this.api.login("api/jwt/login", "admin", "admin")
      .then((response) => {
        return response;
      })
      .catch(e => {
        console.log(e)
        this.log(e, "ERROR")
      });
    this.api2.login(undefined, "1000", "1234")
      .then((response) => {
        return response;
      })
      .catch(e => {
        this.log(e, "ERROR")
      });
  }

  createMixer() {
    let Mixer = new nodefony.webAudio.Mixer("Mixer", {}, this);
    return Mixer;
  }

  createMediaStream() {
    const md = new nodefony.medias.MediaStream(document.getElementById("myvideo"), {}, this);
    return md.getUserMedia({})
      .then((stream) => {
        md.attachMediaStream();
        return stream;
      });
  }

  createWebsocket() {
    let sock = new nodefony.WebSocket(`wss://localhost:5152/ws?foo=bar&bar=foo`, {
      protocol: "sip"
    }, this);
    sock.on("onopen", (event) => {
      this.logger(`onopen`, event)
    })
    sock.on("onmessage", (event) => {
      this.logger(`onmessage`, event)
    })
    sock.on("onerror", (error) => {
      this.logger(`onerror`, error)
    })
    setTimeout(async () => {
      let res = await sock.sendAsync(JSON.stringify({
          foo: "bar"
        }))
        .catch((error) => {
          console.error(error);
        })
      if (res) {
        console.log(res);
      }
    }, 1000);
  }

  createSocket() {
    let sock = new nodefony.Socket(`wss://localhost:5152/socket?foo=bar&bar=foo`, null, this);
    sock.on("onopen", (event) => {
      this.logger(`onopen`, event);
    });
    sock.on("onmessage", (event) => {
      this.logger(`onmessage`, event);
    });
    sock.on("onerror", (error) => {
      this.logger(`onerror`, error);
    });
  }

  createSip() {
    const user = "1002";
    const passwd = "1002";
    //const user = "5021";
    //const passwd = "1234";

    const url = `wss://localhost:8090/ws`;
    //const url = `ws://localhost:8090/ws`;
    //const url = `wss://pbx.example.com:8089/ws`;
    //const url = `ws://pbx.example.com:8088/ws`;

    const server = "nodefony.com";
    const transport = new nodefony.WebSocket(url, {
      protocol: "sip"
    }, this);
    transport.on("onerror", (event, code, reason)=>{
      this.log(`Websocket Error code : ${code||null} ==> ${reason}`,"ERROR");
    });
    transport.on("onclose", (event, code, reason)=>{
      this.log(`Websocket Close code : ${code} => ${reason}`,"WARNING");
    });
    const sip = new nodefony.protocols.Sip(server, transport, {}, this);
    sip.on("onConnect" ,()=>{
      this.log("connect asterisk")
      sip.register(user, passwd);
    })

    sip.on("onRegister" ,()=>{
      this.log(`Register User ${user} asterisk`);
    });
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
