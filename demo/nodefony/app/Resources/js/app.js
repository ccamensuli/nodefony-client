/*
 *
 *	ENTRY POINT
 *  WEBPACK bundle app
 *  client side
 */
import "../css/app.css";
// with release production

/*import nodefony from "nodefony-client";
import media from "nodefony-client/dist/medias";
media(nodefony);
import webaudio from "nodefony-client/dist/webaudio";
webaudio(nodefony);
import socket from "nodefony-client/dist/socket";
socket(nodefony);
import sip from "nodefony-client/dist/sip";
sip(nodefony);
window.nodefony = nodefony;*/

// dev
import Nodefony from "../../../../../src/nodefony.es6";
//console.log(process.env.NODE_ENV)
const nodefony = new Nodefony(process.env.NODE_ENV, process.env.NODE_DEBUG);
import Media from "../../../../../src/medias/medias.es6";
Media(nodefony);
//console.log(nodefony)
import Socket from "../../../../../src/transports/socket/socket.es6";
Socket(nodefony);
import Webaudio from "../../../../../src/medias/webaudio/webaudio.es6";
Webaudio(nodefony);

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
    this.on("load", () => {
      this.initialize();
    });
    //this.log("LOG DEMO INFO", "INFO");
    //this.log("LOG DEMO ERROR", "ERROR");
    //this.log("LOG DEMO WARNING", "WARNING");
    //this.log("LOG DEMO DEBUG", "DEBUG");
    //let error = new Error("my error");
    //this.log(error, "ERROR");
  }

  async initialize() {
    this.createMixer();
    await this.createMediaStream();
    //this.createWebsocket();
    this.createSocket();
    //this.initializeApi();
    //this.login();
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
        this.log(response.result.token)
        return response;
      })
      .catch(e => {
        console.log(e)
        this.log(e, "ERROR")
      });
    this.api2.login(undefined, "1000", "1234")
      .then((response) => {
        this.log(response.result.token)
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
    const sock = new nodefony.WebSocket(`wss://localhost:5152/ws?foo=bar&bar=foo`, {
      protocol: "sip"
    }, this);
    sock.on("onopen", (event) => {
      this.logger(`onopen`, event)
      setTimeout(async () => {
        let res = await sock.sendAsync(JSON.stringify({
            foo: "bar"
          }))
          .catch((error) => {
            console.error(error);
          })
        if (res) {
          this.log(res);
        }
      }, 1000);
    })
    sock.on("onmessage", (event) => {
      this.log( event, "DEBUG")
    })
    sock.on("onerror", (error) => {
      this.log( error, "ERROR")
    })
  }

  createSocket() {
    this.log("createSocket")
    //const sock = new nodefony.Socket(`wss://localhost:5152/socket`, null, this);
    this.socket = new nodefony.Socket(`/nodefony/socket`, null, this);
    this.socket.on("handshake", (message, socket) => {
      socket.log("handshake", "INFO");
    });
    this.socket.on("ready", (message, socket) => {
      this.log(`ready`);
      this.subscribeMonitoring();
    });
    this.socket.on("disconnect", (message, socket) => {
      socket.log("disconnect", "INFO");
    });
    this.socket.on("message", (service, message, socket) => {
      socket.log("message", "INFO");
      socket.log(JSON.parse(message), "DEBUG");
    });
    this.socket.on("subscribe", (service, message, socket) => {
      socket.log(`Socket subscribe ${service}`)
      setTimeout(() => {
        socket.unSubscribe(service);
      }, 10 * 1000);
    });
    this.socket.on("monitoring", (message, socket) => {
      //socket.logger(JSON.parse(message));
      //socket.log(JSON.parse(message));
    });
    this.socket.on("unsubscribe", (service, message, socket) => {
      socket.log(`Socket unsubscribe : ${service}`)
    });
    this.socket.on("connect", (message, socket) => {
      socket.log(`Socket connect`)
    });
    this.socket.on("error", (code, args, message) => {
      this.socket.log( message, "ERROR");
    });
    setTimeout(() => {
      this.socket.stop();
    }, 12 * 1000);

    setTimeout(() => {
      this.socket.start();
    }, 20 * 1000);

    this.log(this.socket);
  }

  subscribeMonitoring(){
    return this.socket.subscribe("monitoring");
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
