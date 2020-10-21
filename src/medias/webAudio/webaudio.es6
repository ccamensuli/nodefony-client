import AudioBus from './audiobus.es6';
import Track from './track.es6';
import Mixer from './mixer.es6';

let audioContext = null;
const webAudioApi = function () {
  audioContext = window.AudioContext || window.webkitAudioContext;
  if (audioContext) {
    return true;
  }
  return false;
}();

export default {
  audioContext,
  Mixer,
  AudioBus,
  Track
}
