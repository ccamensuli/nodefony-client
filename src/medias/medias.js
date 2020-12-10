'use strict';
import Stream from "./streams/stream.js";

export default (nodefony) => {
  const stream = Stream(nodefony);
  nodefony.modules.push("medias")
  class Medias {
    constructor() {
      this.Stream = stream;
    }

    async getDevices() {
      //this.devices = new Map();
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (devices) {
        let audioMap = await this.getAudioDevices(devices);
        let videoMap = await this.getWebcams(devices);
        this.devices = new Map([...audioMap, ...videoMap]);
        if (!this.defaultWebcam) {
          this.defaultWebcam = videoMap.values().next().value;
        }
        if (!this.defaultAudio) {
          this.defaultAudio = audioMap.values().next().value;
        }
        return this.devices;
      }
      return this.devices = new Map();
    }

    async getAudioDevices(devices = null) {
      this.audioDevices = new Map();
      if (!devices) {
        devices = await navigator.mediaDevices.enumerateDevices();
      }
      if (devices) {
        for (const device of devices) {
          if (device.kind !== 'audioinput') {
            continue;
          }
          if (device.deviceId === "default") {
            this.defaultAudio = device;
          }
          this.audioDevices.set(device.deviceId, device);
        }
      }
      return this.audioDevices;
    }

    async getWebcams(devices = null) {
      this.webcams = new Map();
      if (!devices) {
        devices = await navigator.mediaDevices.enumerateDevices();
      }
      if (devices) {
        for (const device of devices) {
          if (device.kind !== 'videoinput') {
            continue;
          }
          if (device.deviceId === "default") {
            this.defaultWebcam = device;
          }
          this.webcams.set(device.deviceId, device);
        }
      }
      return this.webcams;
    }

    getWebcamType(device) {
      if (/(back|rear)/i.test(device.label)) {
        return 'back';
      } else {
        return 'front';
      }
    }
  }
  return nodefony.medias = new Medias();
};
