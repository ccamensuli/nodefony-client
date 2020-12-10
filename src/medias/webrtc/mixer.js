export default (nodefony) => {

  const dtmfRef = {
    "1": [697, 1209],
    "2": [697, 1336],
    "3": [697, 1477],
    "4": [770, 1209],
    "5": [770, 1336],
    "6": [770, 1477],
    "7": [852, 1209],
    "8": [852, 1336],
    "9": [852, 1477],
    "#": [941, 1209],
    "0": [941, 1336],
    "*": [941, 1477]
  };

  class Mixer extends nodefony.Service {
    constructor(service) {
      super("WEB AUDIO DTMF", service.container);
      this.mixer = new nodefony.webAudio.Mixer("dtmf", {}, this);
      this.dtmf = this.buildDtmf();
      this.tone = this.buildTone();
    }

    addTrack(name, media) {
      return this.mixer.createTrack(media, {
        name: name,
        gain: true,
        panner: false,
        filter: false,
        analyser: false
      });
    }

    playDtmf(key, duration) {
      return new Promise((resolve, reject) => {
        try {
          const touch = key + ""
          if (touch in this.dtmf) {
            this.dtmf[touch].play(0);
            setTimeout(() => {
              this.dtmf[touch].pause();
              return resolve(this.dtmf[touch]);
            }, duration || 500)
          } else {
            return reject(new Error(`Dtmf ${key} not exist`))
          }
        } catch (e) {
          return reject(e);
        }
      });
    }

    playTone(timeBlink = 1600, duration = null, key = null) {
      return new Promise((resolve, reject) => {
        try {
          const tone = key ? this.dtmf[key] : this.tone;
          let interval = null;
          let blink = timeBlink;
          let time = duration || (blink * 10 * 2);
          if (tone) {
            const stop = () => {
              clearInterval(interval);
              interval = null;
              tone.pause(0);
              return reject(tone)
            }
            const play = () => {
              tone.play(0);
              interval = setInterval(() => {
                if (tone.muted) {
                  tone.unmute();
                } else {
                  tone.mute();
                }
              }, blink)
              setTimeout(() => {
                stop();
              }, time);
            }
            play();
            return resolve({
              play: play,
              stop: stop,
              track: tone
            })
          } else {
            return reject(new Error(`Track 440 not exist`))
          }
        } catch (e) {
          return reject(e);
        }
      });
    }

    playBusy() {
      return this.playTone(500, 3000);
    }

    buildDtmf() {
      let obj = {};
      for (var dtmf in dtmfRef) {
        const os1 = this.mixer.createOscillator();
        os1.type = "sine";
        os1.frequency.value = dtmfRef[dtmf][0];
        const os2 = this.mixer.createOscillator();
        os2.type = "sine";
        os2.frequency.value = dtmfRef[dtmf][1];
        const merger = this.mixer.createChannelMerger(2);
        os1.connect(merger, 0, 0);
        os2.connect(merger, 0, 1);
        os1.start(0);
        os2.start(0);
        const track = this.addTrack(dtmf, merger);
        obj[dtmf] = track;
      }
      return obj;
    }

    buildTone() {
      // LA 440
      const os = this.mixer.createOscillator();
      os.type = "sine";
      os.frequency.value = 440;
      //os.start(0);
      const track = this.addTrack("440", os);
      return track;
    }
  }

  return Mixer;

};
