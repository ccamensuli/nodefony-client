let kernel = new nodefony.Service("kernel");
kernel.initSyslog();
kernel.once("start", (mix)=>{
  kernel.debug(kernel, mix)
});
setTimeout(()=>{
  let Mixer = new nodefony.medias.Mixer(kernel);
  kernel.emit("start", Mixer)
  kernel.log(document.getElementById("myvideo"))
  let md = new nodefony.medias.MediaStream(document.getElementById("myvideo"), {}, kernel);
  md.getUserMedia({})
  .then( (stream) => {
    md.attachMediaStream();
    //media.getVideoTracks();
  });
},2000)
kernel.log("LOG DEMO INFO", "INFO");
kernel.log("LOG DEMO ERROR", "ERROR");
kernel.log("LOG DEMO WARNING", "WARNING");
kernel.log("LOG DEMO DEBUG", "DEBUG");
