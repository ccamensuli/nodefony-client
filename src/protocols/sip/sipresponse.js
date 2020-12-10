export default (nodefony) => {

  const codeMessage = {
    200: "OK"
  };

  const fromToG =  /(.*)?<sip:(.*)@(.*)>/;
  const endline = "\r\n";

  class sipResponse {
    constructor(message, code, messageCode, bodyMessage, typeBody) {
      this.message = message;
      this.transaction = message.transaction;
      this.dialog = message.dialog;
      this.responseLine = {};
      this.buildResponseLine(code, messageCode);
      this.header = []; // message.header.messageHeaders;
      this.buildHeader(message);
      this.buildBody(bodyMessage || "", typeBody);
    }

    buildHeader(message) {
      for (let head in message.rawHeader) {
        let i = 0;
        switch (head) {
        case "Allow":
        case "Supported":
          var ptr = "";
          for (i = 0; i < message.header[head].length; i++) {
            if (i < message.header[head].length - 1) {
              ptr += message.header[head][i] + ",";
            } else {
              ptr += message.header[head][i];
            }
          }
          this.header.push(head + ": " + ptr);
          break;
        case "Via":
          if (this.responseLine.code == "487") {
            for (i = 0; i < this.dialog[head].length; i++) {
              this.header.push(this.dialog[head][i].raw);
            }
          } else {
            for (i = 0; i < message.header[head].length; i++) {
              this.header.push(message.header[head][i].raw);
            }
          }
          break;
        case "User-Agent":
          this.header.push("User-Agent: " + this.transaction.dialog.sip.settings.userAgent);
          break;
        case "Contact":
          /*var rport = this.transaction.dialog.sip.rport ;
          var ip = this.transaction.dialog.sip.publicAddress;
          if ( rport ){
            this.header.push( "Contact: <sip:" +this.transaction.to+"@"+ip+":"+rport+";transport="+this.transaction.dialog.sip.settings.transport.toLowerCase()+">");
          }else{
            this.header.push( "Contact: <sip:" +this.transaction.to+"@"+ip+";transport="+this.transaction.dialog.sip.settings.transport.toLowerCase()+">");
          }*/
          this.header.push("Contact: " + this.dialog.contact);
          break;
        case "To":
          //console.log(message.header[head] )
          //console.log(this.dialog.sip.displayName )
          var ret = fromToG.exec(message.header[head]);
          //console.log(ret)
          if (ret && (!ret[1])) {
            //console.log("traff to")
            message.header[head] = '"' + this.dialog.sip.displayName + '"' + message.header[head];
          }
          //console.log(message.header[head])
          if (!message.header[head].match(/;tag=/)) {
            this.header.push(head + ": " + message.header[head] + (this.transaction.dialog.tagFrom ? ";tag=" + this.transaction.dialog.tagFrom : ""));
          } else {
            this.header.push(head + ": " + message.header[head]);
          }
          break;
        case "Record-Route":
          for (i = this.message.dialog.routes.length - 1; i >= 0; i--) {
            this.header.push(head + ": " + this.message.header.recordRoutes[i]);
          }
          break;
        case "CSeq":
          if (this.responseLine.code == "487" && this.dialog.method === "CANCEL") {
            this.header.push(head + ": " + message.header[head].replace("CANCEL", "INVITE"));
          } else {
            this.header.push(head + ": " + message.header[head]);
          }
          break;
        case "Content-Type":
        case "Organization":
        case "Server":
        case "Content-Length":
          break;
        default:
          this.header.push(head + ": " + message.header[head]);
        }
      }
    }

    getHeader() {
      let head = "";
      for (let line in this.header) {
        head += this.header[line] + endline;
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

    buildResponseLine(code, messageCode) {
      this.responseLine.method = this.transaction.method.toUpperCase();
      this.responseLine.version = this.transaction.dialog.sip.version;
      this.responseLine.code = code;
      this.responseLine.message = messageCode || codeMessage[code];
    }

    getResponseline() {
      if (this.responseLine.method === "ACK") {
        return this.responseLine.method + " " + "sip:" + this.transaction.from + "@" + this.transaction.dialog.sip.server + " " + this.responseLine.version + endline;
      }
      return this.responseLine.version + " " + this.responseLine.code + " " + this.responseLine.message + endline;
    }

    getMessage() {
      //console.log("RESPONSE : " +this.getResponseline() + this.getHeader() + endline + this.getBody())
      return this.rawResponse = this.getResponseline() + this.getHeader() + endline + this.getBody();
    }

    send() {
      return this.transaction.send(this.getMessage());
    }
  }

  return sipResponse;
};
