import AudioBus from './audiobus.es6';
import Track from './track.es6';
import Mixer from './mixer.es6';

const audioContext = window.AudioContext || window.webkitAudioContext;

export default {
  audioContext,
  Mixer,
  AudioBus,
  Track
};
