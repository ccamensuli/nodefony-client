export default (nodefony) => {
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
