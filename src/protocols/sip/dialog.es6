import transaction from './transaction.es6';
import sipMessage from './sipmessage.es6';

export default (nodefony) => {

  const Transaction = transaction(nodefony);
  const SipMessage = sipMessage(nodefony);

  const statusCode = {
    INITIAL: 0,
    EARLY: 1, // on 1xx
    ESTABLISHED: 2, // on 200 ok
    TERMINATED: 3, // on by
    CANCEL: 4 // cancel
  };

  const byteToHex = function (byte) {
    return ('0' + byte.toString(16)).slice(-2);
  };

  const generateId = function (len) {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return [].map.call(arr, byteToHex).join("");
  };

  class Dialog {
    constructor(method, sip) {
      this.sip = sip;
      this.transactions = {};
      this.statusCode = statusCode;
      this.status = this.statusCode.INITIAL;
      this.routes = null;
      this.from = this.sip.from;
      this.maxForward = this.sip.settings.maxForward;
      this.expires = this.sip.settings.expires;
      this.tagFrom = this.generateTag();
      this.cseq = this.generateCseq();
      this.unregisterSended = false;
      if (method instanceof SipMessage) {
        this.hydrate(method);
      } else {
        this.method = method;
        this.callId = this.generateCallId();
        this.status = this.statusCode.INITIAL;
        this.to = null;
        this.tagTo = null;
      }
      //this.contact = this.sip.generateContact( null, null, true) ;
      this.contact = this.sip.contact;
    }

    hydrate(message) {

      if (message.type === "REQUEST") {
        this.cseq = message.cseq;
        this.method = message.method;
        this.callId = message.callId;

        // to
        if (message.fromNameDisplay) {
          this.to = '"' + message.fromNameDisplay + '"' + "<sip:" + message.from + ">";
        } else {
          this.to = "<sip:" + message.from + ">";
        }
        this.toName = message.fromName;
        this.tagTo = message.fromTag || this.generateTag();
        //from
        this.tagFrom = message.toTag || this.tagFrom;
        if (message.toNameDisplay) {
          this.from = '"' + message.toNameDisplay + '"' + '<sip:' + message.to + '>';
        } else {
          this.from = "<sip:" + message.to + ">";
        }
        this.fromName = message.toName;


        // manage routes
        if (message.header.recordRoutes.length) {
          this.routes = message.header.recordRoutes.reverse();
        }

        // FIXME if (  ! this["request-uri"] &&  message.contact )
        if (message.contact) {
          //this["request-uri"] =  message.contact + ":" + message.rport
          this["request-uri"] = message.contact;
        }

      }
      if (message.type === "RESPONSE") {
        this.cseq = message.cseq;
        if (!this.callId) {
          this.callId = message.callId;
        }
        if (!this.to) {
          if (message.toNameDisplay) {
            this.to = '"' + message.toNameDisplay + '"' + "<sip:" + message.to + ">";
          } else {
            this.to = "<sip:" + message.to + ">";
          }
        } else {
          if (message.toNameDisplay) {
            this.to = '"' + message.toNameDisplay + '"' + "<sip:" + message.to + ">";
          }
        }

        if (message.toTag) {
          this.tagTo = message.toTag;
        }
        if (message.fromTag) {
          this.tagFrom = message.fromTag;
        }
        // FIXME if (  ! this["request-uri"] &&  message.contact )
        if (message.contact) {
          //this["request-uri"] =  message.contact + ":" + message.rport
          this["request-uri"] = message.contact;
        }

        // manage routes
        if (message.header.recordRoutes.length) {
          this.routes = message.header.recordRoutes;
        }
      }
    }

    generateCallId() {
      return generateId() + "@nodefony";
    }

    generateTag() {
      return "nodefony" + parseInt(Math.random() * 1000000000, 10);
    }

    generateCseq() {
      return 1;
    }

    incCseq() {
      this.cseq = this.cseq + 1;
      return this.cseq;
    }

    getTransaction(id) {
      if (id in this.transactions) {
        return this.transactions[id];
      }
      return null;
    }

    createTransaction(to) {
      this.currentTransaction = new Transaction(to || this.to, this);
      this.sip.log("SIP NEW TRANSACTION :" + this.currentTransaction.branch, "DEBUG");
      this.transactions[this.currentTransaction.branch] = this.currentTransaction;
      return this.currentTransaction;
    }

    register() {
      let trans = this.createTransaction(this.from);
      this.to = this.from;
      let request = trans.createRequest();
      request.send();
      return trans;
    }

    unregister() {
      this.expires = 0;
      this.contact = "*";
      let trans = this.createTransaction(this.from);
      this.to = this.from;
      this.tagTo = null;
      let request = trans.createRequest();
      request.send();
      this.unregisterSended = true;
      return trans;
    }

    ack( /*message*/ ) {
      if (!this["request-uri"]) {
        this["request-uri"] = this.sip["request-uri"];
      }
      //this.method = "ACK" ;
      let trans = this.createTransaction();
      trans.method = "ACK";
      let request = trans.createRequest();
      request.send();
      return request;
    }

    invite(userTo, description, type) {

      if (this.status === this.statusCode.CANCEL) {
        return null;
      }
      this.sip.log("SIP INVITE DIALOG", "DEBUG");
      if (userTo) {
        this.to = "<sip:" + userTo + ">";
      }
      this.method = "INVITE";
      if (!this["request-uri"]) {
        this["request-uri"] = "sip:" + userTo;
      }

      if (description.sdp) {
        this.bodyType = "application/sdp";
        this.body = description.sdp;
      } else {
        this.bodyType = type;
        this.body = description;
      }
      let trans = this.createTransaction(this.to);
      let request = trans.createRequest(this.body, this.bodyType);
      request.send();
      return trans;

    }

    notify(userTo, notify, typeNotify) {
      this.method = "NOTIFY";
      if (userTo) {
        this.to = "<sip:" + userTo + ">";
      }
      if (!this["request-uri"]) {
        this["request-uri"] = "sip:" + userTo;
      }
      if (typeNotify) {
        this.bodyType = typeNotify;
      }
      if (notify) {
        this.body = notify;
      }
      let trans = this.createTransaction(this.to);
      let request = trans.createRequest(this.body, this.bodyType);
      request.send();
      return this;

    }

    info(info, typeInfo) {
      this.method = "INFO";

      if (typeInfo) {
        this.bodyType = typeInfo;
      }
      if (info) {
        this.body = info;
      }
      let trans = this.createTransaction(this.to);
      let request = trans.createRequest(this.body, this.bodyType);
      request.send();
      return this;

    }

    bye() {
      this.method = "BYE";
      let trans = this.createTransaction();
      let request = trans.createRequest();
      request.send();
      return this;

    }

    clear(id) {
      if (id) {
        if (this.transactions[id]) {
          this.transactions[id].clear();
          delete this.transactions[id];
        } else {
          throw new Error("TRANSACTION not found :" + id);
        }
      } else {
        for (let transac in this.transactions) {
          this.transactions[transac].clear();
          delete this.transactions[transac];
        }
      }
    }
  }

  return Dialog;
};
