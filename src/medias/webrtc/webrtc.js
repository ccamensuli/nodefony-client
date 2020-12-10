'use strict';
import peer from './peer.js';
import transaction from './transaction.js';
import mixer from './mixer.js';

export default function (nodefony) {
  nodefony.modules.push("webrtc");

  const Peer = peer(nodefony);
  const Transaction = transaction(nodefony);
  const Mixer = mixer(nodefony);
  const defaultSettings = {
    transport: {
      url: null,
      protocol: null
    },
    peer: {},
    dtmf: {
      type: "SIP-INFO", // null || "SIP-INFO"
      duration: 500,
      gap: 50
    }
  };

  class WebRtc extends nodefony.Service {

    constructor(peer, settings, protocol, service) {
      super("WebRtc", service ? service.container : null, null, nodefony.extend({}, defaultSettings, settings));
      this.peers = new Map();
      this.transactions = new Map();
      this.peer = this.createPeer(peer, this.options.peer, false);
      this.protocol = protocol;
      try {
        this.mixer = new Mixer(this);
        this.log(this.mixer, "DEBUG");
      } catch (e) {
        this.log(e, "WARNING");
      }
    }

    register(userName, password, settings) {
      if (!this.protocol) {
        return this.connect(userName, password, settings)
          .then((transport) => {
            this.defaultListener();
            return this.peer;
          })
      }
      return new Promise((resolve) => {
        this.fire("register", this.peer, this);
        this.sipListener();
        return resolve(this.peer);
      })
    }

    async unRegister(transaction) {
      if (this.protocol) {
        this.protocol.unregister()
      }else{
        this.fire("unregister", this);
      }
      this.close();
    }

    createPeer(name, settings, createStrem = true) {
      const peer = new Peer(name, settings, this);
      if (createStrem) {
        peer.createStream();
      }
      this.peers.set(name, peer)
      return peer;
    }

    getWebrtcTransaction(id) {
      return this.transactions.get(id);
    }

    getCallId(id) {
      return id.replace(/(.*)@(.*)/, "$1")
    }

    async closeWebrtcTransaction(id) {
      const transaction = this.transactions.get(id);
      if (transaction) {
        await transaction.close();
        this.deleteWebrtcTransaction(id);
      }
      return transaction;
    }
    deleteWebrtcTransaction(id) {
      return this.transactions.delete(id);
    }

    createWebrtcTransaction(id, peer, to, settings) {
      const transaction = new Transaction(peer, to, settings, this);
      transaction.setId(id);
      this.transactions.set(id, transaction);
      transaction.on("peerconnected", (...args) => {
        this.fire("peerconnected", ...args);
      });
      transaction.on("icecandidate", (...args) => {
        this.fire("icecandidate", ...args);
      });
      transaction.on("answer", (...args) => {
        this.fire("answer", ...args);
      });
      transaction.on("offer", (...args) => {
        this.fire("offer", ...args);
      });
      // DTMF
      transaction.on("dtmf", (...args) => {
        this.fire("dtmf", ...args);
      });
      // keypress dtmf event
      this.on("keypress", (...args) => {
        if (transaction.sendDtmf) {
          transaction.sendDtmf(...args);
        }
      });
      return transaction;
    }

    defaultListener() {
      this.on("icecandidate", (event, transaction) => {
        transaction.send({
          'iceCandidate': event.candidate
        });
      });
      this.on("answer", (description, transaction) => {
        transaction.send({
          'answer': description
        });
      });
      this.on("offer", (description, transaction) => {
        transaction.send({
          'offer': description
        });
      });
    }

    sipListener() {
      // WEBRTC EVENTS
      this.on("answer", (description, transaction) => {
        try {
          const response = transaction.dialog.currentTransaction.createResponse(200, "OK", description.sdp, "application/sdp");
          response.send();
        } catch (e) {
          this.log(e, "WARNING");
          throw e;
        }
      });
      this.on("offer", (description, transaction) => {
        try {
          transaction.dialog = this.protocol.invite(transaction.to.name, description);
        } catch (e) {
          this.log(e, "WARNING");
          throw e;
        }
      });
      this.on("dtmf", (event, transaction) => {
        const dialog = transaction.dialog ;
        if (dialog && this.options.dtmf.type === "SIP-INFO") {
          if (dialog.status !== dialog.statusCode.ESTABLISHED) {
            throw new Error(`Sip Dialog not ready statusCode ${dialog.status}`);
          }
          const description = "Signal=" + event.tone + "\nDuration=" + this.options.dtmf.duration;
          const type = "application/dtmf-relay";
          dialog.info(description, type);
        }
      });
      // SIP EVENTS
      this.protocol.on("onQuit", (sip, message) => {
        this.close();
      });
      this.protocol.on("onUnRegister", (sip, message) => {
        this.close();
        this.fire("unregister", message, sip);
      });

      this.protocol.on("onRinging", (sip, message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.getWebrtcTransaction(id);
        if (transaction) {
          this.fire("ringing", transaction.to, transaction);
        }
      });

      this.protocol.on("onTrying", (sip, message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.getWebrtcTransaction(id);
        if (transaction) {
          this.fire("trying", transaction.to, transaction);
        }
      });

      this.protocol.on("onInvite", async (message, dialog) => {
        let res = null;
        const id = this.getCallId(message.callId);
        let transaction = this.getWebrtcTransaction(id);
        let remotePeer = null;
        switch (message.header["Content-Type"]) {
        case "application/sdp":
          if (message.rawBody) {
            if (dialog.status === dialog.statusCode.INITIAL) {
              // TODO MANAGE MULTI CALL
              res = message.transaction.createResponse(100, "trying");
              res.send();
              // transaction WEBRTC
              try {
                remotePeer = this.createPeer(message.fromName, {
                  displayName: message.fromNameDisplay
                });
                const id = this.getCallId(message.callId);
                transaction = this.createWebrtcTransaction(id, this.peer, remotePeer);
                transaction.dialog = dialog;
              } catch (e) {
                res = message.transaction.createResponse(500, e.message || e);
                res.send();
                return;
              }
              res = message.transaction.createResponse(180, "Ringing");
              res.send();
              try {
                let desc = {
                  type: "offer",
                  sdp: message.rawBody
                };
                const accept = () => {
                  this.log(`accept Offer ${remotePeer.name}`, "DEBUG")
                  this.fire("accept", remotePeer, transaction);
                  this.fire("offhook", remotePeer, transaction);
                  //this.fire("addPeer", remotePeer, transaction);
                  this.createAnswer(transaction);
                }
                const decline = () => {
                  this.log(`Decline Offer ${remotePeer.name}`, "DEBUG")
                  transaction.close();
                  this.transactions.delete(transaction.id);
                  this.decline(transaction);
                  remotePeer.createStream();
                }
                await transaction.setRemoteDescription(desc);
                this.fire("invite", remotePeer, accept, decline);
              } catch (e) {
                this.log(e, "ERROR");
                this.log(message.rawBody, "DEBUG")
                res = message.transaction.createResponse(500, e.message);
                res.send();
              }
              return;
            }
            if (dialog.status === dialog.statusCode.ESTABLISHED) {
              // HOLD THE LINE
              message.transaction.decline();
            }
          }
          break;
        case "ice/candidate":
          if (message.rawBody) {
            let ret = null;
            if (!transaction) {
              ret = message.transaction.createResponse(500, "no transaction ");
              ret.send();
              return;
            }
            try {
              ret = message.transaction.createResponse(100, "trying");
              ret.send();
              await transaction.addIceCandidate(message.rawBody);
              ret = message.transaction.createResponse(200, "OK", message.rawBody, "ice/candidate");
              ret.send();
            } catch (e) {
              ret = message.transaction.createResponse(500, e.message);
              ret.send();
              return;
            }
          }
          break;
        default:
          this.fire("error", this.protocol, message);
        }
      });

      this.protocol.on("onCall", async (message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.getWebrtcTransaction(id);
        if (message.toNameDisplay) {
          transaction.to.displayName = message.toNameDisplay;
        }
        if (message.dialog.status === message.dialog.statusCode.EARLY && message.header["Content-Type"] === "application/sdp") {
          let desc = {
            type: "answer",
            sdp: message.rawBody
          };
          await transaction.setRemoteDescription(desc);
          this.fire("accept", transaction.to, transaction);
          this.fire("offhook", transaction.to, transaction);
        }
        if (message.header["Content-Type"] === "ice/candidate") {
          const res = JSON.parse(message.rawBody);
          for (let i = 0; i < res.length; i++) {
            await transaction.addIceCandidate(res[i]);
          }
        }
      });

      this.protocol.on("onInfo", (message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.getWebrtcTransaction(id);
        if (message.contentType === "application/dtmf-relay") {
          this.fire("dtmf", message.body.dtmf, transaction.from);
        }
        this.fire("info", message.body, transaction);
      });

      this.protocol.on("onCancel", (message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.closeWebrtcTransaction(id);
        if (transaction) {
          this.fire("cancel", message.body.body, transaction);
        }
      });

      this.protocol.on("onError", (Class, message) => {
        const id = this.getCallId(message.callId);
        this.closeWebrtcTransaction(id);
        this.fire("error", Class, message);
      });

      this.protocol.on("onTimeout", (sip, message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.closeWebrtcTransaction(id);
        this.fire("timeout", message.method, 408, message, transaction);
      });

      this.protocol.on("onDecline", (message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.closeWebrtcTransaction(id);
        this.fire("decline", transaction, this);
      });

      this.protocol.on("onQuit", (protocol) => {
        this.fire("quit", this);
        this.close();
      });
      this.protocol.on("onBye", (message) => {
        const id = this.getCallId(message.callId);
        const transaction = this.getWebrtcTransaction(id);
        this.fire("onhook", transaction.to, transaction);
        transaction.to.detachStream()
        this.closeWebrtcTransaction(id);
        /*if (!transaction) {
          this.close();
        }*/
      });

      this.protocol.on("onInitCall", (to, dialog) => {
        const id = this.getCallId(dialog.callId);
        const transaction = this.getWebrtcTransaction(id);
        if (transaction) {
          this.fire("initcall", transaction);
        }
      });

      this.protocol.on("onMessage", (message) => {
        this.fire("message", message);
      });

      this.protocol.on("onSend", (message) => {
        this.fire("send", message);
      });
    }

    connect(userName, password) {
      return new Promise((resolve, reject) => {
        if (!this.options.transport.url) {
          return reject(new Error("No url defined in transport settings"));
        }
        try {
          this.transport = new nodefony.WebSocket(this.options.transport.url, this.options.transport.protocol, this);
          this.transport.on("onopen", (event) => {
            this.fire("register", event, this);
            return resolve(this.transport);
          });
          this.transport.on("onmessage", async (message) => {
            const msg = JSON.parse(message.data);
            this.log(msg, "DEBUG");
            this.fire("message", msg, this);
            let transaction = this.transactions.get(msg.callid);
            if (msg.offer && !transaction) {
              const remotePeer = this.createPeer(msg.from);
              const transaction = this.createWebrtcTransaction(msg.callid, this.peer, remotePeer);
              await transaction.setRemoteDescription(msg.offer);
              const accept = (to) => {
                this.log(`Accept Offer ${to.name}`, "DEBUG")
                this.createAnswer(transaction)
              }
              const decline = (to) => {
                try {
                  this.transactions.delete(transaction.id);
                  //transaction.decline();
                  this.decline(transaction)
                  remotePeer.createStream();
                  transaction.close();
                } catch (e) {
                  this.log(e, "ERROR");
                  throw e;
                }
              }
              this.fire("invite", remotePeer, accept, decline);
              return;
            }
            if (transaction) {
              if (msg.answer) {
                await transaction.setRemoteDescription(msg.answer);
                return;
              }
              if (msg.iceCandidate) {
                await transaction.addIceCandidate(msg.iceCandidate);
                return;
              }
            }
            return;
          });
          this.transport.on("onclose", (status) => {
            this.clean();
            this.fire("onclose", status, this);
          });
        } catch (e) {
          return reject(e);
        }
      });
    }

    async createOffer(to, settings, callid = nodefony.generateId()) {
      const remotePeer = this.createPeer(to);
      const transaction = this.createWebrtcTransaction(callid, this.peer, remotePeer, settings);
      if (this.protocol) {
        this.protocol.once("onInitCall", (to, diag, siptransaction) => {
          this.transactions.delete(callid);
          const id = this.getCallId(diag.callId);
          transaction.setId(id);
          this.transactions.set(id, transaction);
        });
      }
      await transaction.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      });
      return transaction;
    }

    async cancel(transaction) {
      return await transaction.cancel();
    }

    async decline(transaction) {
      return await transaction.decline();
    }

    async bye(transaction) {
      return await transaction.bye();
    }

    async createAnswer(transaction) {
      await transaction.createAnswer();
      return transaction;
    }

    close() {
      this.fire("close", this);
      setTimeout(() => {
        this.clean();
      }, 1000);
    }

    clean() {
      this.cleanTransactions();
      this.cleanPeers();
      if (this.protocol) {
        this.protocol.clear();
        this.protocol = null;
        delete this.protocol;
      }
      this.removeAllListeners();
    }

    cleanTransactions() {
      this.transactions.forEach((transation) => {
        transation.close();
      });
      this.transactions.clear();
    }

    cleanPeers(){
      this.peers.forEach((peer) => {
        peer.clean();
      });
    }

    send(message) {
      this.fire("send", message);
      this.transport.send(JSON.stringify(message));
    }

  }

  return nodefony.WebRtc = WebRtc;
}
