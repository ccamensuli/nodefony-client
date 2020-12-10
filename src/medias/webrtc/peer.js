'use strict';

export default function (nodefony) {

  const defaultSettings = {
    constraints:{
      video: true,
      audio: true
    }
  }

  class Peer extends nodefony.medias.Stream {

    constructor(name, settings = {}, service) {
      let constraints = nodefony.extend(true, {}, defaultSettings, settings);
      super(null, constraints, service);
      this.name = name;
      this.displayName = this.options.displayName || name;
      this.audioRtpSender = [];
      this.videoRtpSender = [];
    }

    clean(){
      delete this.audioRtpSender;
      this.audioRtpSender = [];
      delete this.videoRtpSender;
      this.videoRtpSender = [];
      this.detachStream();
    }

  }

  return Peer;
}
