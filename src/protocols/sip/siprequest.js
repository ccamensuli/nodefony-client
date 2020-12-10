export default (nodefony) => {

  const endline = "\r\n";
  const endHeader = "\r\n\r\n";

  class sipRequest {

    constructor(transaction, bodyMessage, typeBody) {
      this.transaction = transaction;
      this["request-port"] = this.transaction.dialog.sip.serverPort;

      this.type = "request";
      this.requestLine = {};
      this.buildRequestline();

      this.header = {};
      this.buildHeader();

      this.buildBody(bodyMessage || "", typeBody);
    }

    buildRequestline() {
      this.requestLine.method = this.transaction.method.toUpperCase();
      this.requestLine.version = this.transaction.dialog.sip.version;
    }

    getRequestline(uri) {
      switch (this.transaction.method) {
      case "REGISTER":
        this["request-uri"] = "sip:" + this.transaction.dialog.sip.server;
        return this.transaction.method + " " + this["request-uri"] + " " + this.requestLine.version + endline;
      case "INVITE":
      case "BYE":
      case "NOTIFY":
      case "INFO":
      case "CANCEL":
      case "ACK":
        this["request-uri"] = this.transaction.dialog["request-uri"];
        return this.transaction.method + " " + this["request-uri"] + " " + this.requestLine.version + endline;
      }
    }

    buildHeader() {
      //FIXE ME RPORT IN VIA PARSER

      let rport = this.transaction.dialog.sip.rport;
      let ip = this.transaction.dialog.sip.publicAddress;

      this.header.via = "Via: " + this.transaction.dialog.sip.via + ";" + "branch=" + this.transaction.branch;
      //if ( rport ){
      //this.header.via  = "Via: "+this.transaction.dialog.sip.version+"/"+this.transaction.dialog.sip.settings.transport+" " +ip+":"+rport+";"+"branch="+this.transaction.branch;
      //}else{
      //this.header.via  = "Via: "+this.transaction.dialog.sip.version+"/"+this.transaction.dialog.sip.settings.transport+" " +ip+":"+this["request-port"]+";"+"branch="+this.transaction.branch;
      //}
      this.header.cseq = "CSeq: " + this.transaction.dialog.cseq + " " + this.transaction.method;

      this.header.from = "From: " + this.transaction.dialog.from + ";tag=" + this.transaction.dialog.tagFrom;

      let tagTo = this.transaction.dialog.tagTo ? ";tag=" + this.transaction.dialog.tagTo : "";
      this.header.to = "To: " + this.transaction.to + tagTo;

      this.header.callId = "Call-ID: " + this.transaction.dialog.callId;
      this.header.expires = "Expires: " + this.transaction.dialog.expires;
      this.header.maxForward = "Max-Forwards: " + this.transaction.dialog.maxForward;
      this.header.userAgent = "User-Agent: " + this.transaction.dialog.sip.settings.userAgent;

      this.header.contact = "Contact: " + this.transaction.dialog.contact;

      if (this.transaction.dialog.routes && this.transaction.dialog.routes.length) {
        this.header.routes = [];
        for (let i = this.transaction.dialog.routes.length - 1; i >= 0; i--) {
          this.header.routes.push("Route: " + this.transaction.dialog.routes[i]);
        }
      }
    }

    getHeader() {
      var head = "";
      for (var line in this.header) {
        switch (nodefony.typeOf(this.header[line])) {
        case "string":
          head += this.header[line] + endline;
          break;
        case "array":
          for (var i = 0; i < this.header[line].length; i++) {
            head += this.header[line][i] + endline;
          }
          break;
        }
      }
      return head;
    }

    buildBody(body, type) {
      this.header.contentLength = "Content-Length: " + body.length;
      if (type) {
        this.header.contentType = "Content-Type: " + type;
      }
      this.body = body || "";
    }

    getBody() {
      return this.body;
    }

    getMessage() {
      //console.log(this.getRequestline() + this.getHeader() + endline + this.getBody())
      //console.log(this.getRequestline() + this.getHeader() + endline + this.getBody())
      return this.rawResponse = this.getRequestline() + this.getHeader() + endline + this.getBody();
    }

    send() {
      return this.transaction.send(this.getMessage());
    }
  }

  return sipRequest;
};
