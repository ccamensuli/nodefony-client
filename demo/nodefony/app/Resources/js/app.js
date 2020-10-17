/*
 *
 *	ENTRY POINT
 *  WEBPACK bundle app
 *  client side
 */
import "../css/app.css";

import nodefony from "../../../../../entry.es6?medias=true&socket=true";
nodefony.preloadMedias();
nodefony.preloadSocket();
//console.log(nodefony)

/*
 *	Class Bundle App
 */
class App extends nodefony.Service {
  constructor() {
    super("kernel");
    this.initSyslog();
    this.once("start", (mix) => {
      //this.debug(this, mix)
      this.createWebsocket();
      this.createSocket();
    });
    setTimeout(() => {
      let Mixer = new nodefony.medias.Mixer(this);
      this.emit("start", Mixer)
      let md = new nodefony.medias.MediaStream(document.getElementById("myvideo"), {}, this);
      md.getUserMedia({})
        .then((stream) => {
          md.attachMediaStream();
          //media.getVideoTracks();
        });
    }, 2000)
    this.log("LOG DEMO INFO", "INFO");
    this.log("LOG DEMO ERROR", "ERROR");
    this.log("LOG DEMO WARNING", "WARNING");
    this.log("LOG DEMO DEBUG", "DEBUG");
  }

  createWebsocket() {
    let sock = new nodefony.WebSocket(`wss://localhost:5152/ws?foo=bar&bar=foo`, {
      protocol: "sip"
    }, this);
    sock.on("onopen", (event) => {
      this.debug(`onopen`, event)
    })
    sock.on("onmessage", (event) => {
      this.debug(`onmessage`, event)
    })
    sock.on("onerror", (error) => {
      this.debug(`onerror`, error)
    })
    setTimeout(async () => {
      let res = await sock.sendAsync(JSON.stringify({
        foo: "bar"
      }))
      .catch((error)=>{
        console.error(error);
      })
      if (res){
        console.log(res);
      }
    }, 1000);
  }
  createSocket() {
    let sock = new nodefony.Socket(`wss://localhost:5152/socket?foo=bar&bar=foo`, null, this);
    sock.on("onopen", (event) => {
      this.debug(`onopen`, event)
    });
    sock.on("onmessage", (event) => {
      this.debug(`onmessage`, event)
    });
    sock.on("onerror", (error) => {
      this.debug(`onerror`, error)
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
