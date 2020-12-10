'use strict';

export default function (nodefony) {

  const defaultSettings = {
    'iceServers': [{
      urls: 'stun:stun.l.google.com:19302'
    }]
  }

  class webRtcTransaction extends nodefony.Service {

    constructor(from, to, settings = defaultSettings, service) {
      super("WEBRTC TRANSACTION", service.container, null, settings);
      this.webrtc = service;
      this.from = from;
      this.to = to;
      this.initialize();
    }

    setId(id = null) {
      this.id = id;
    }

    initialize() {
      this.candidates = [];
      this.id = null;
      this.iceGatheringState = 'Unknown';
      this.dtmfSender = null;
      this.dialog = null;
      this.dtmfOptions = {};
      this.createPeerConnection(this.options);
      this.addTracks();
    }

    addTracks() {
      this.from.getTracks().forEach(track => {
        let sender = this.peerConnection.addTrack(track, this.from.stream);
        if (track.kind === "audio") {
          this.from.audioRtpSender.push(sender);
        }
        if (track.kind === "video") {
          this.from.videoRtpSender.push(sender);
        }
      });
    }

    createPeerConnection(settings = null) {
      this.peerConnection = new RTCPeerConnection(settings || this.options);
      // Listen for local ICE candidates on the local RTCPeerConnection
      this.peerConnection.addEventListener('icecandidate', (event) => {
        this.iceGatheringState = this.peerConnection.iceGatheringState;
        if (event.candidate) {
          this.log(" Event : icecandidate", "DEBUG");
          this.candidates.push(event.candidate);
          this.fire("icecandidate", event, this);
        }
        if (this.iceGatheringState === "complete") {
          this.fire("icecandidatecomplete", event, this);
        }
      });
      this.peerConnection.addEventListener('onicegatheringstatechange', event => {
        this.log(" Event : onicegatheringstatechange", "DEBUG");
        this.fire("onicegatheringstatechange", event, this)
      });
      this.peerConnection.addEventListener("negotiationneeded", (event) => {
        this.log(" Event : negotiationneeded", "DEBUG");
        this.fire("negotiationneeded", event, this)
      });
      this.peerConnection.addEventListener('iceconnectionstatechange', event => {
        this.log(" Event : iceconnectionstatechange", "DEBUG");
        this.fire("iceconnectionstatechange", event, this)
      });
      // Listen for connectionstatechange on the local RTCPeerConnection
      this.peerConnection.addEventListener('connectionstatechange', event => {
        this.log(" Event : connectionstatechange", "DEBUG");
        if (this.peerConnection.connectionState === 'connected') {
          this.fire("peerconnected", event, this)
        }
      });
      this.peerConnection.addEventListener('addstream', (event) => {
        this.log(" Event : addstream", "DEBUG");
        this.log(event, "DEBUG");
      });
      this.peerConnection.addEventListener('track', async (event) => {
        this.log(" Event : track", "DEBUG");
        await this.to.addTrack(event.track);
        this.fire("addtrack", event.track, event, this);
        this.initializeDtmf(this.to, event);
      });
    }

    createOffer(settings) {
      return new Promise(async (resolve, reject) => {
        try {
          this.once("icecandidatecomplete", async (event) => {
            this.from.description = this.peerConnection.localDescription;
            this.fire("offer", this.from.description, this);
            return resolve(this.from.description)
          });
          this.offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(this.offer);
        } catch (e) {
          this.log(e, "ERROR");
          return reject(e);
        }
      });
    }

    async createAnswer() {
      return new Promise(async (resolve, reject) => {
        try {
          this.once("icecandidatecomplete", async (event) => {
            this.from.description = this.peerConnection.localDescription;
            this.fire("answer", this.from.description, this);
          });
          this.answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(this.answer);
          return resolve(this.answer);
        } catch (e) {
          this.log(e, "ERROR");
          return reject(e);
        }
      });
    }

    async setRemoteDescription(description) {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
        this.to.description = this.peerConnection.remoteDescription;
        this.fire("remote", this.to);
        return this.peerConnection.remoteDescription;
      } catch (e) {
        throw e;
      }
    }

    async addIceCandidate(candidate) {
      this.log(candidate, "DEBUG");
      try {
        return await this.peerConnection.addIceCandidate(candidate);
      } catch (e) {
        this.log('Error adding received ice candidate', "ERROR");
        this.logger(e);
      }
    }

    createDataChannel() {
      this.dataChannel = peerConnection.createDataChannel();
      this.peerConnection.addEventListener('datachannel', event => {
        const dataChannel = event.channel;
        this.fire("datachannel", dataChannel, event, this);
      });
      this.dataChannel.addEventListener('open', event => {
        this.fire("opendatachannel", event, this);
      });
      this.dataChannel.addEventListener('close', event => {
        this.fire("closedatachannel", event, this);
      });
    }

    close(bye = true) {
      this.log(`Close transaction ${this.id}`, "DEBUG");
      if(this.closed){
        return;
      }
      if(bye){
        this.bye();
      }
      this.peerConnection.close();
      this.answer = null;
      this.offer = null;
      if (this.dataChannel) {
        this.dataChannel.close();
      }
      this.removeAllListeners();
      this.closed = true;
    }

    cancel() {
      if (this.dialog && this.dialog.currentTransaction) {
        this.dialog.currentTransaction.cancel();
      }
      this.close();
    }

    decline() {
      if (this.dialog && this.dialog.currentTransaction) {
        this.dialog.currentTransaction.decline();
      }
      this.close();
    }

    bye() {
      if (this.dialog) {
        this.dialog.bye();
      }
      this.close(false);
    }

    // dtmf
    initializeDtmf(options = this.dtmfOptions) {
      this.dtmfOptions = options;
      if (!this.peerConnection.createDTMFSender) {
        throw new Error(" RTCPeerConnection method createDTMFSender() !!!! which is not support by this browser", 500);
      }
      if (this.to) {
        this.initDtmfSender(this.to);
      } else {
        throw new Error('No stream to create DTMF Sender');
      }

      /*if (this.dtmfOptions.type) {
        try {
          switch (this.dtmfOptions.type) {
          case "SIP-INFO":
            if (!dialog) {
              throw new Error("initializeDtmf error no dialog");
            }
            delete this.dtmfSender;
            const func = function () {};
            func.prototype.insertDTMF = (key, duration, gap) => {
              if (this.dialog) {
                if (this.dialog.status !== this.dialog.statusCode.ESTABLISHED) {
                  throw new Error(`Sip Dialog not ready statusCode ${this.dialog.status}`);
                }
              }
              const description = "Signal=" + key + "\nDuration=" + duration;
              const type = "application/dtmf-relay";
              dialog.info(description, type);
            };
            func.prototype.canInsertDTMF = true;
            this.dtmfSender = new func();
            break;
          }
        } catch (e) {
          this.log(e, "WARNING");
          throw e;
        }
      }*/
    }

    async initDtmfSender(peer) {
      try {
        if (peer) {
          if (!this.peerConnection.getSenders) {
            throw new Error('Requires the RTCPeerConnection method getSenders() which is not support by this browser.')
          }
          const senders = this.peerConnection.getSenders();
          const audioSender = senders.find(sender => sender.track && sender.track.kind === 'audio');
          if (!audioSender) {
            throw new Error('No local audio track to send DTMF with');
          }
          if (!audioSender.dtmf) {
            throw new Error('Requires DTMF which is not support by this browser.');
          }
          this.dtmfSender = audioSender.dtmf;
          this.dtmfSender.ontonechange = (event) => {
            this.log(`Event tonechange `, "DEBUG");
            if (event.tone){
              this.fire("dtmf", event, this);
            }
            this.fire("tonechange", event);
          };
        }
      } catch (e) {
        this.log(e, "WARNING");
      }
    }

    sendDtmf(code, key, event) {
      if (this.dtmfSender && this.dtmfSender.canInsertDTMF) {
        const duration = this.dtmfOptions.duration || 500;
        const gap = this.dtmfOptions.gap || 50;
        this.log(`Send dtmf : ${key} duration : ${duration} gap : ${gap}`, "DEBUG");
        return this.dtmfSender.insertDTMF(key, duration, gap);
      }
      this.log(new Error("DTMF SENDER not ready"), "WARNING");
    }

    send(message) {
      message.from = this.from.name;
      message.to = this.to.name;
      message.callid = this.id;
      return this.webrtc.send(message);
    }

  }

  return webRtcTransaction;
}
