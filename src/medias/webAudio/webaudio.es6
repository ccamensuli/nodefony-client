import audiobus from './audiobus.es6';
import track from './track.es6';
import mixer from './mixer.es6';

export default (nodefony) => {
  audiobus(nodefony);
  track(nodefony);
  mixer(nodefony);
  let audioContext = null;
  const webAudioApi = function () {
    audioContext = window.AudioContext || window.webkitAudioContext;
    if (audioContext) {
      return true;
    }
    return false;
  }();
  nodefony.medias.audioContext = audioContext ;
  return {
    audioContext
  };
}
