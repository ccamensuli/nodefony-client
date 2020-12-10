import AudioBus from './audiobus.js';
import Track from './track.js';
import Mixer from './mixer.js';

export default (nodefony)=>{
  nodefony.modules.push("webaudio");
  const audioContext = window.AudioContext || window.webkitAudioContext;
   return nodefony.webAudio = {
    audioContext,
    Mixer: Mixer(nodefony),
    AudioBus : AudioBus(nodefony),
    Track: Track(nodefony)
  };
};
