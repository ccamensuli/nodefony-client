/*
 *
 *	ENTRY POINT
 *  WEBPACK bundle app
 *  client side
 */
import "../css/app.css";

import nodefony from "../../../../../entry.es6";
console.log(nodefony)

/*
 *	Class Bundle App
 */
class App extends nodefony.Service {
  constructor() {
    super("kernel");
    this.initSyslog();
    this.once("start", (mix)=>{
      this.debug(this, mix)
    });
    setTimeout(()=>{
      let Mixer = new nodefony.medias.Mixer(this);
      this.emit("start", Mixer)
      this.log(document.getElementById("myvideo"))
      let md = new nodefony.medias.MediaStream(document.getElementById("myvideo"), {}, this);
      md.getUserMedia({})
      .then( (stream) => {
        md.attachMediaStream();
        //media.getVideoTracks();
      });
    },2000)
    this.log("LOG DEMO INFO", "INFO");
    this.log("LOG DEMO ERROR", "ERROR");
    this.log("LOG DEMO WARNING", "WARNING");
    this.log("LOG DEMO DEBUG", "DEBUG");
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
