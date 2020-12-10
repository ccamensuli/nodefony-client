import sipRequest from './siprequest.js';
import sipResponse from './sipresponse.js';
import sipMessage from './sipmessage.js';

export default (nodefony) => {

  const generateHex = function () {
    return Math.floor(Math.random() * 167772150000000).toString(16);
  };

  const SipRequest = sipRequest(nodefony);
  const SipResponse = sipResponse(nodefony);
  //const SipMessage = sipMessage(nodefony);
  //const SipMessage = nodefony.protocols.Sip.SipMessage();


  class Transaction {
    constructor(to, dialog) {
      this.dialog = dialog;
      if (to instanceof nodefony.protocols.Sip.SipMessage()) {
        this.hydrate(to);
      } else {
        this.to = to;
        this.from = dialog.from;
        this.method = dialog.method;
        this.branch = this.generateBranchId();
      }
      this.responses = {};
      this.requests = {};
      this.interval = null;
    }

    hydrate(message) {
      this.message = message;
      if (message.type === "REQUEST") {
        this.to = this.dialog.to;
        this.from = this.dialog.from;
        this.method = this.dialog.method;
        this.branch = this.message.header.branch;
      }
      if (message.type === "RESPONSE") {
        this.to = this.dialog.to;
        this.from = this.dialog.from;
        this.method = this.dialog.method;
        this.branch = this.message.header.branch;
      }
      return message ;
    }

    generateBranchId() {
      let hex = generateHex();
      if (hex.length === 12) {
        return "z9hG4bK" + hex;
      } else {
        return this.generateBranchId();
      }
    }

    createRequest(body, typeBody) {
      if (this.method !== "ACK" && this.method !== "CANCEL") {
        this.dialog.incCseq();
      }
      this.request = new SipRequest(this, body || "", typeBody);
      this.message = null;
      return this.request;
    }

    createResponse(code, message, body, typeBody) {
      if (this.method === "INVITE" || this.method === "ACK") {
        switch (true) {
        case code < 200:
          this.dialog.status = this.dialog.statusCode.EARLY;
          break;
        case code < 300:
          this.dialog.status = this.dialog.statusCode.ESTABLISHED;
          break;
        default:
          this.dialog.status = this.dialog.statusCode.TERMINATED;
        }
      }
      this.response = new SipResponse(this.message, code, message, body, typeBody);
      return this.response;
    }

    send(message) {
      return this.dialog.sip.send(message);
    }

    cancel() {
      this.method = "CANCEL";
      this.dialog.routes = null;
      this.dialog.tagTo = "";
      let request = this.createRequest();
      request.send();
      this.dialog.status = this.dialog.statusCode.CANCEL;
      return request;
    }

    decline() {
      let ret = this.createResponse(
        603,
        "Declined"
      );
      ret.send();
      return ret;
    }

    clear() {
      // CLEAR INTERVAL
      if (this.interval) {
        clearInterval(this.interval);
      }
    }

    bye() {
      if (this.dialog) {
        this.dialog.bye();
      }
    }
  }

  return Transaction;
};
