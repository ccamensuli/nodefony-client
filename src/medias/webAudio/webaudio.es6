import AudioBus from './audiobus.es6';
import Track from './track.es6';
import Mixer from './mixer.es6';

export default (nodefony)=>{

  const audioContext = window.AudioContext || window.webkitAudioContext;

   return nodefony.webAudio = {
    audioContext,
    Mixer: Mixer(nodefony),
    AudioBus : AudioBus(nodefony),
    Track: Track(nodefony)
  };
};
