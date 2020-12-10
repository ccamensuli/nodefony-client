/*import nodefony from "nodefony-client";
import media from "nodefony-client/dist/medias.js";
media(nodefony);
import webaudio from "nodefony-client/dist/webaudio";
webaudio(nodefony);
import socket from "nodefony-client/dist/socket";
socket(nodefony);
import sip from "nodefony-client/dist/sip";
sip(nodefony);
window.nodefony = nodefony;*/

// dev
import Nodefony from "../../../../../src/nodefony.js";
//console.log(process.env.NODE_ENV)
const nodefony = new Nodefony(process.env.NODE_ENV);
import Media from "../../../../../src/medias/medias.js";
Media(nodefony);
//console.log(nodefony)
import Socket from "../../../../../src/transports/socket/socket.js";
Socket(nodefony);
import Webaudio from "../../../../../src/medias/webaudio/webaudio.js";
Webaudio(nodefony);
import Sip from "../../../../../src/protocols/sip/sip.js";
Sip(nodefony);
window.nodefony = nodefony;


class Test extends nodefony.Kernel {
  constructor() {
    super("Test", {
      debug:true
    });
    this.initialize();
    this.on("load", () => {

      this.load();
    });
  }

  initialize(){
    this.log("initialize");
    mocha.setup({
      //allowUncaught: true,
      //asyncOnly: true,
      //bail: true,
      //checkLeaks: true,
      //forbidOnly: true,
      //forbidPending: true,
      //global: [nodefony],
      //retries: 3,
      //slow: '100',
      //timeout: '2000',
      ui: 'bdd'
    });
    //mocha.growl();
    mocha.checkLeaks();
  }

  load(){
    this.log("load");
    mocha.run((code)=>{
      this.log(`End Test with code  ${code}`);
    });
    //console.log(mocha,mocha.suite)
  }

}

export default new Test();
