
const kernel = new nodefony.Kernel("kernel",{
  environment: "development",
  debug: true
});
kernel.on("load", (event) => {
  try {
    kernel.log(this, "DEBUG");
    kernel.log("CREATE webAudio Mixer", "DEBUG");
    let Mixer = new nodefony.webAudio.Mixer("Mixer", {}, kernel);
    kernel.log("CREATE MediaStream", "DEBUG");
    let md = new nodefony.medias.Stream(document.getElementById("myvideo"), {}, kernel);
    md.getUserMedia({})
      .then((stream) => {
        md.attachStream();
      });
    kernel.logger(kernel, Mixer)
  } catch (error) {
    kernel.log(error, "ERROR");
    throw error;
  }
});
