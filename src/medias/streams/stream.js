  export default (nodefony) => {

    const defaultSettingsStream = {
      constraints: {
        video: true,
        audio: true
      }
    };

    class Stream extends nodefony.Service {

      constructor(mediaElement, settings, service = null) {
        super("Stream", service ? service.container : null, null, nodefony.extend({}, defaultSettingsStream, settings));
        this.urlStream = null;
        this.mediaElement = mediaElement ? mediaElement : null;
        this.streamId = null;
      }

      get stream() {
        return this._stream;
      }

      set stream(value) {
        return this.setStream(value);
      }

      createStream() {
        this.stream = new MediaStream();
        return this.stream;
      }

      setStream(value) {
        this._stream = value || new MediaStream();
        this.streamId = this._stream.id;
        this.videotracks = this.getVideoTracks();
        this.audiotracks = this.getAudioTracks();
        this._stream.onremovetrack = (event) => {
          this.fire("onRemovetrack", event, this);
        };
        this._stream.onaddtrack = (event) => {
          this.fire("onAddtrack", event, this);
        };
        return this._stream;
      }

      addTrack(track) {
        return this.stream.addTrack(track, this.stream);
      }

      removeTrack(track) {
        return this.stream.removeTrack(track);
      }

      getUserMedia(settings = {}) {
        return new Promise((resolve, reject) => {
          const options = nodefony.extend({}, this.options.constraints, settings);
          this.settingsToListen(options);
          return navigator.mediaDevices.getUserMedia(options)
            .then((stream) => {
              this.stream = stream;
              this.fire("onSuccess", this.stream, this);
              return resolve(this.stream);
            })
            .catch((e) => {
              this.fire("onError", e, this);
              return reject(e);
            });
        });
      }

      // todo  https://webrtc.github.io/samples/src/content/getusermedia/getdisplaymedia/
      // https://github.com/webrtc/samples/tree/gh-pages/src/content/getusermedia/getdisplaymedia
      getUserScreen(settings = {}) {
        return new Promise((resolve, reject) => {
          const options = nodefony.extend({}, this.options.constraints, settings);
          this.settingsToListen(options);
          return navigator.mediaDevices.getDisplayMedia(options)
            .then((stream) => {
              this.stream = stream;
              this.fire("onSuccess", this.stream, this);
              return resolve(this.stream);
            })
            .catch((e) => {
              this.fire("onError", e, this);
              return reject(e);
            });
        });
      }

      stop(stream = this.stream) {
        return new Promise((resolve, reject) => {
          try {
            if (stream) {
              this.getTracks(stream).forEach(track => track.stop());
              this.stream = null;
              return resolve(stream);
            }
          } catch (e) {
            this.fire("onError", e);
            return reject(e);
          }
          return resolve(this.stream);
        });
      }

      async clear(){
        await this.stop();
        this.detachDomElement();
      }

      getTracks(stream = this.stream) {
        let error = null;
        if (stream) {
          return stream.getTracks();
        }
        return [];
      }

      detachStream(){
        return new Promise(async (resolve, reject) => {
          try{
            await this.stop();
            if(this.mediaElement){
              this.mediaElement.srcObject = this.createStream();
              this.fire("detachstream", this.mediaElement);
            }
            return resolve(this.stream)
          }catch(e){
            return reject(e);
          }
        })
      }

      attachStream(element = this.mediaElement, stream = this.stream) {
        return new Promise((resolve, reject) => {
          try {
            this.mediaElement = element;
            if( !this.mediaElement ){
              throw new Error(`can't attachStream ! no dom element to attach `);
            }
            if ("srcObject" in this.mediaElement) {
              this.mediaElement.srcObject = stream;
            } else {
              this.mediaElement.src = window.URL.createObjectURL(stream);
            }
            return this.mediaElement.play()
              .then((event) => {
                this.fire("playing", event, this.mediaElement);
                return resolve(this.mediaElement);
              }).catch(e => {
                this.fire("onError", e);
                return reject(e);
              })
            this.mediaElement.onloadedmetadata = (event) => {
              this.fire("onloadedmetadata", event, this.mediaElement);
            };
          } catch (e) {
            this.fire("onError", e);
            return reject(e);
          }
        });
      }

      reattachStream(stream, element = this.mediaElement) {
        let error = null;
        if (stream) {
          this.stream = stream;
          if (element) {
            return this.attachStream(element);
          }
          error = new Error("no dom element detected for reattach Stream ");
          this.fire("onError", error);
          throw error;
        }
        error = new Error("no Stream detected");
        this.fire("onError", error);
        throw error;
      }

      detachDomElement(){
        if(this.mediaElement){
          this.mediaElement.srcObject = null;
          this.fire("detachdom", this.mediaElement);
        }
      }

      attachDomElement(){
        if(this.mediaElement){
          this.mediaElement.srcObject = this.stream;
          this.fire("attachdom", this.mediaElement);
        }
      }

      getVideoTracks(stream = this.stream) {
        if (stream) {
          return stream.getVideoTracks();
        }
        return [];
      }

      getAudioTracks(stream = this.stream) {
        if (stream) {
          return stream.getAudioTracks();
        }
        return [];
      }

      whiteNoise(width, height, r = 1, g = 1, b = 1) {
        return new Promise((resolve, reject) => {
          try {
            const canvas = Object.assign(document.createElement("canvas"), {
              width,
              height
            });
            const ctx = canvas.getContext('2d');
            ctx.fillRect(0, 0, width, height);
            const p = ctx.getImageData(0, 0, width, height);
            const draw = () => {
              for (let i = 0; i < p.data.length; i++) {
                const color = Math.random() * 255;
                p.data[i++] = color * r;
                p.data[i++] = color * g;
                p.data[i++] = color * b;
              }
              ctx.putImageData(p, 0, 0);
              requestAnimationFrame(draw);
            };
            requestAnimationFrame(draw);
            this.stream = canvas.captureStream()
            return resolve(this.stream);
          } catch (e) {
            return reject(e);
          }
        })
      }

    }

    return Stream;
  };
