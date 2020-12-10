import "../css/webrtc.css";
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
import Medias from "../../../../../src/medias/medias.js";
Medias(nodefony);
import Webrtc from "../../../../../src/medias/webrtc/webrtc.js";
Webrtc(nodefony);
window.nodefony = nodefony;

const qvgaConstraints = {
  video: {width: {exact: 320}, height: {exact: 240}},
  audio: true
};

const vgaConstraints = {
  video: {width: {exact: 640}, height: {exact: 480}},
  audio: true
};

const hdConstraints = {
  video: {width: {exact: 1280}, height: {exact: 720}},
  audio: true
};

const fullHdConstraints = {
  video: {width: {exact: 1920}, height: {exact: 1080}},
  audio: true
};

const fourKConstraints = {
  video: {width: {exact: 4096}, height: {exact: 2160}},
  audio: true
};

const eightKConstraints = {
  video: {width: {exact: 7680}, height: {exact: 4320}},
  audio: true
};

/*
 *	Class App
 */
class App extends nodefony.Kernel {
  constructor() {
    super("App", {
      environment: process.env.NODE_ENV || "production",
      debug: process.env.NODE_DEBUG || false
    });
    this.transport = null;
    this.sip = null;
    this.webrtc = null;

    this.on("load", () => {
      this.showBanner();
      this.registerStart = document.getElementById("start");
      this.registerStop = document.getElementById("stop");
      this.offerButton = document.getElementById("offer");
      this.registerStart.addEventListener("click", () =>{
        this.transport = this.createWebSocket("wss://localhost", "8090");
        this.sip = this.initializeSip(window.name, window.name, this.transport);
      })
      this.registerStop.addEventListener("click", () =>{
        this.webrtc.unRegister(this.transaction);
        this.initKeyboard();
      })

      this.initKeyboard();
    });
  }

  resetKeyboard(){
    this.keyboard = document.getElementById("keyboard");
    let input = document.getElementById("to");
    this.offerButton.setAttribute("value", "offer");
    this.offerButton.innerHTML = "offer";
    input.value = "";
  }

  initKeyboard(){
    const key = {
  		"0":48,
  		"1":49,
  		"2":50,
  		"3":51,
  		"4":52,
  		"5":53,
  		"6":54,
  		"7":55,
  		"8":56,
  		"9":57,
  		"*":42,
  		"#":35
  	};
    this.keyboard = document.getElementById("keyboard");
    let selector = document.querySelectorAll(".block");
    let input = document.getElementById("to");
    selector.forEach((item, i) => {
      item.addEventListener("click", (event) =>{
        const value  = event.target.getAttribute("value");
        this.log(`Key press ${value}`);
        // if SIP_INFO DTMF
        //this.webrtc.mixer.playDtmf(value);
        this.webrtc.fire("keypress", key[value], value, event);
        let val = input.value ;
        input.value="";
        input.value = val+value;
      });
    });
    this.offerButton.addEventListener("click", () =>{
      let value = this.offerButton.getAttribute("value");
      if( value === "offer"){
        this.offerButton.setAttribute("value", "cancel");
        this.offerButton.innerHTML = "cancel";
        return this.offer(input.value);
      }
      if ( value === "cancel"){
        this.resetKeyboard()
        return this.cancel();
      }
      if ( value === "onhook"){
        this.resetKeyboard()
        return this.bye();
      }
    })
    return this.keyboard;
  }

  // transport
  createWebSocket(domain = "wss://localhost", port="8090") {
    const url = `${domain}:${port}/ws`;
    const transport = new nodefony.WebSocket(url, {
      protocol: "sip"
    }, this);
    //this.log(transport, "DEBUG");
    transport.on("onerror", (event, code, reason) => {
      this.log(`Websocket Error code : ${code||null} ==> ${reason}`, "ERROR");
    });
    transport.on("onclose", (event, code, reason) => {
      this.log(`Websocket Close code : ${code} => ${reason}`, "WARNING");
    });
    return transport ;
  }

  // sip
  // EVENTS : onConnect onRegister
  initializeSip(user, passwd, transport, type = null) {
    const server = "nodefony.com";
    const sip = new nodefony.protocols.Sip(server, transport, {
      transport: type
    }, this);
    this.webrtc = this.initializeWebRtc(user, sip);
    sip.on("onConnect", () => {
      sip.register(user, passwd);
      this.keyboard.style.display = "block";
      this.registerStart.style.display = "none";
      this.registerStop.style.display = "block";
    });
    sip.on("onRegister", () => {
      this.log(`Register User ${user} asterisk`);
      this.registerWebrtc();
    });
    this.log(sip, "DEBUG")
    return sip;
  }

  // stack webrtc

  initializeWebRtc(name, protocol) {
    const webrtc = new nodefony.WebRtc(name, {
      /*transport: {
        url: `wss:${env.NODEFONY_DOMAIN}:5152/webrtc/ws?name=${name}`
      }*/
    }, protocol, this);

    return webrtc ;
  }

// EVENTS : invite accept decline cancel onhook quit trying ringing unregister timeout dtmf initcall info
  registerWebrtc(){
    this.webrtc.register()
    .then((peer)=>{
      let width = 400;
      //peer.getUserMedia(vgaConstraints)
      //peer.getUserScreen()
      peer.whiteNoise(width, ((width*9)/16), 1, 1 , 1)
      .then((stream)=>{
        return peer.attachStream(document.getElementById("video"));
      });
      // invitation
      this.webrtc.on("invite", (from, accept, decline)=>{
        this.log(from.name)
        const resultat = window.confirm(`Invite by ${from.name}`);
        if (resultat){
          return accept(from);
        }
        return decline(from);
      })
      // decline
      this.webrtc.on("decline", (peer)=>{
        this.log(`${peer.name} à decliné l'appel`);
        if( this.ring){
          this.ring.stop();
        }
      })
      // raccroché
      this.webrtc.on("onhook", (peer)=>{
        this.log(`${peer.name} à raccroché `);
        this.resetKeyboard();
      });
      // décroché
      this.webrtc.on("offhook", (peer, transaction)=>{
        this.log(`${peer.name} à décroché `)
        this.transaction = transaction ;
        peer.attachStream(document.getElementById("remote"), peer.stream);
        if( this.ring){
          this.ring.stop();
        }
        this.offerButton.innerHTML = "onhook";
        this.offerButton.setAttribute("value", "onhook");
      });
      // sonne
      this.webrtc.on("ringing", async  (peer)=>{
        if (this.ring ){
          this.ring.stop();
          this.reing = null;
        }
        this.log(`${peer.name} sonne`);
        this.ring = await this.webrtc.mixer.playTone()
        .then((tone)=>{
            //tone.play();
            return tone;
        })
        .catch(e =>{
          this.ring = null;
        })
      });
      // dtmf
      this.webrtc.on("dtmf", (tone)=>{
        console.log(tone)
      });

      this.webrtc.on("unregister", (tone)=>{
          this.keyboard.style.display = "none";
          this.registerStart.style.display = "block";
          this.registerStop.style.display = "none";
      });
      //error
      this.webrtc.on("error", (stack, error)=>{
        if( this.ring){
          this.ring.stop();
        }
        this.ring = null;
        this.resetKeyboard();
      });
    });
  }

  async offer(to){
    return this.transaction = await this.webrtc.createOffer(to);
  }

  async cancel(){
    if(this.transaction){
      return await this.webrtc.cancel(this.transaction);
    }
  }
  async bye(){
    if(this.transaction){
      return await this.webrtc.bye(this.transaction);
    }
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
