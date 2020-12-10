import sipHeader from './sipheader.js';
import sipBody from './sipbody.js';

export default (nodefony) => {

  const SipHeader = sipHeader(nodefony);
  const SipBody = sipBody(nodefony);

  const firstline = function (firstLine) {
    let method = firstLine[0];
    let code = firstLine[1];
    if (method === "BYE" && !code) {
      code = 200;
    }
    let message = "";
    for (let i = 2; i < firstLine.length; i++) {
      message += firstLine[i] + " ";
    }
    return {
      method: method,
      code: code,
      message: message
    };
  };

  const regSIP = /\r\n\r\n/;

  class sipMessage {
    constructor(message, sip) {
      this.sip = sip;
      if (message) {
        this.rawMessage = message;
        this.header = null;
        this.body = null;
        this.statusLine = null;
        this.contentLength = 0;
        this.code = null;
        this.statusLine = "";
        this.split = message.split(regSIP);
        if (this.split.length && this.split.length <= 2) {
          try {
            this.parseHeader();
            this.contentLength = parseInt(this.header["Content-Length"], 10);
            this.parseBody();
            this.statusLine = firstline(this.header.firstLine);
            this.code = parseInt(this.statusLine.code, 10);
            this.getType();
          } catch (e) {
            throw e;
          }
          this.rawHeader = this.header.rawHeader;
          //console.log(this.rawHeader)
        }
        this.getDialog();
        this.getTransaction();

      } else {
        throw new Error("BAD FORMAT MESSAGE SIP no message", 500);
      }
    }

    getType() {
      if (this.code) {
        if ((typeof this.code) === "number" && !isNaN(this.code)) {
          this.type = "RESPONSE";
        } else {
          throw new Error("BAD FORMAT MESSAGE SIP message code   ");
        }
      } else {
        if (this.method) {
          this.type = "REQUEST";
        } else {
          this.type = null;
          throw new Error("BAD FORMAT MESSAGE SIP message type not defined  ");
        }
      }
    }

    parseBody() {
      try {
        if (this.split[1]) {
          this.body = new SipBody(this, this.split[1]);
        } else {
          this.body = new SipBody(this, "");
        }
      } catch (e) {
        this.sip.log("SIP parseBody Message :" + this.split[1], "ERROR");
        throw e;
      }
    }

    parseHeader() {
      if (this.split[0]) {
        try {
          this.header = new SipHeader(this, this.split[0]);
        } catch (e) {
          this.sip.log("SIP parseHeader Message :" + this.split[0], "ERROR");
          throw e;
        }
      } else {
        throw ("BAD FORMAT MESSAGE SIP no header ", 500);
      }
    }

    getContact() {
      return this.contact;
    }

    getHeader() {
      return this.header;
    }

    getBody() {
      return this.body;
    }

    getStatusLine() {
      return this.statusLine;
    }

    getCode() {
      return this.code;
    }

    getDialog() {
      if (this.header["Call-ID"]) {
        this.dialog = this.sip.getDialog(this.header["Call-ID"]);
        if (!this.dialog) {
          this.dialog = this.sip.createDialog(this);
        } else {
          this.dialog.hydrate(this);
          this.sip.log("SIP HYDRATE DIALOG :" + this.dialog.callId, "DEBUG");
        }
        return this.dialog;
      } else {
        throw new Error("BAD FORMAT SIP MESSAGE no Call-ID", 500);
      }
    }

    getTransaction() {
      if (this.header.branch) {
        if (!this.dialog) {
          this.getDialog();
        }
        if (this.dialog) {
          this.transaction = this.dialog.getTransaction(this.header.branch);
          if (!this.transaction) {
            this.transaction = this.dialog.createTransaction(this);
          } else {
            this.sip.log("SIP HYDRATE TRANSACTION :" + this.transaction.branch, "DEBUG");
            this.transaction.hydrate(this);
          }
        } else {
          this.transaction = null;
        }
        return this.transaction;
      } else {
        // TODO CSEQ mandatory
        this.sip.log(this.rawMessage, "ERROR");
        throw new Error("BAD FORMAT SIP MESSAGE no Branch", 500);
      }
    }
  }

  return sipMessage;
};
