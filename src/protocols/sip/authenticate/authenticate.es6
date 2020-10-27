import digest from './digest.es6';

export default  (nodefony) => {

  'use strict';
  /*
   *
   *	DIGEST authenticate
   *
   *
   */
  const reg = /^([^=]+)=(.+)$/;
  const parserAuthenticate = function (str) {
    let ret = str.replace(/"/g, "");
    ret = ret.replace(/Digest /g, "");
    const head = ret.split(",");
    let obj = [];
    for (let i = 0; i < head.length; i++) {
      let res = reg.exec(head[i]);
      let key = res[1].replace(/ |\n|\r/g, "");
      if (res && key) {
        obj[key] = res[2];
      }
    }
    return obj;
  };

  const Digest = digest(nodefony);

  class Authenticate  extends nodefony.Service {
    constructor( dialog, username, password) {
      super("Authenticate");
      this.dialog = dialog;
      this.userName = username;
      this.password = password;
      this.algorithm = null;
      this.timeout = null;
      this.unregisterSended = false;
    }

    parser(data){
      return parserAuthenticate(data);
    }

    register(message, type) {
      //console.log("AUTH REGISTER")
      let head= null;
      if (message.authenticate){
        head = this.parser( message.authenticate );
      }
      //message.authenticate = head ;
      if (!head) {
        head = this.dialog.authenticate;
      } else {
        this.dialog.authenticate = head;
      }
      //this.realm = head.realm;
      //this.nonce = head.nonce;
      //this.cnonce = head.cnonce;
      //this.qop = head.qop;
      this.algorithmName = head.Digestalgorithm ? head.Digestalgorithm : "md5";

      let line = "";
      switch (this.algorithmName.toLowerCase()) {
      case "md5":
        this.algorithm = new Digest(head, message.rawBody, this);
        this.response = this.algorithm.generateResponse(message.method);
        line = this.algorithm.getLine(this.response);
        break;
      }

      let method = "";
      if (!type) {
        method = "Authorization: ";
      } else {
        if (type === "proxy") {
          method = "Proxy-Authorization: ";
        } else {
          method = "Authorization: ";
        }
      }
      //line = this.algorithm.name+" username=" + stringify(this.userName) + ", realm=" + stringify(this.realm) + ", nonce=" + stringify(this.nonce) + ", uri=" + stringify(this.uri) + ", algorithm=" + this.algorithmName + ", response=" + stringify(this.response);
      this.lineResponse = method + line;
      //var transac = message.transaction ;
      let transac = this.dialog.createTransaction(message.transaction.to);
      this.dialog.tagTo = null;
      //this.dialog.sip.fire("onInitCall", this.dialog.toName, this.dialog, transac);
      let request = transac.createRequest(this.dialog.body, this.dialog.bodyType);
      request.header.response = this.lineResponse;
      request.send();
      this.dialog.sip.createDialogTimeout(this.dialog);
      return transac;
    }

    unregister() {
      this.dialog.expires = 0;
      this.dialog.contact = "*";
      let trans = this.dialog.createTransaction(this.dialog.from);
      this.dialog.to = this.dialog.from;
      this.dialog.tagTo = null;
      let request = trans.createRequest();
      if (this.lineResponse) {
        request.header.response = this.lineResponse;
      }
      this.unregisterSended = true;
      request.send();
      return trans;
    }

  }

  return Authenticate;

};
