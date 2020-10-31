
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
import Nodefony from "../../../../../src/nodefony.es6";
//console.log(process.env.NODE_ENV)
const nodefony = new Nodefony(process.env.NODE_ENV);
import Media from "../../../../../src/medias/medias.es6";
Media(nodefony);
//console.log(nodefony)
import Socket from "../../../../../src/transports/socket/socket.es6";
Socket(nodefony);
import Webaudio from "../../../../../src/medias/webaudio/webaudio.es6";
Webaudio(nodefony);
import Sip from "../../../../../src/protocols/sip/sip.es6";
Sip(nodefony);
window.nodefony = nodefony;


class Test extends nodefony.Kernel {
  constructor() {
    super({});
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
