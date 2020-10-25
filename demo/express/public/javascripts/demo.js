//nodefony.preloadMedias();
//nodefony.preloadSocket();

const kernel = new nodefony.Kernel();
kernel.log("LOG DEMO INFO", "INFO");
kernel.on("load", (event) => {
  try {
    kernel.log("CREATE webAudio Mixer", "DEBUG");
    let Mixer = new nodefony.webAudio.Mixer("Mixer", {}, kernel);

    kernel.log("CREATE MediaStream", "DEBUG");
    let md = new nodefony.medias.MediaStream(document.getElementById("myvideo"), {}, kernel);
    md.getUserMedia({})
      .then((stream) => {
        md.attachMediaStream();
      });
    kernel.logger(kernel, Mixer)
  } catch (error) {
    kernel.log(error, "ERROR");
    throw error;
  }
});
