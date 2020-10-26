import digest from './digest.es6';

export default  (nodefony) => {

  'use strict';
  /*
   *
   *	DIGEST authenticate
   *
   *
   */
  const stringify = function (value) {
    return '"' + value + '"';
  };
  const Digest = digest(nodefony);

  class Authenticate  extends nodefony.Service {
    constructor( dialog, username, password) {
      super("Authenticate");
      this.dialog = dialog;
      this.userName = username;
      this.password = password;
      this.uri = "sip:" + this.dialog.sip.server;
      this.realm = "nodefony.com";
      this.nonce = null;
      this.cnonce = null;
      this.nonceCount = null;
      this.qop = null;
      this.algorithm = null;
      this.entity_body = null;
      this.timeout = null;
      this.unregisterSended = false;
    }

    register(message, type) {
      //console.log("AUTH REGISTER")
      //console.log(message);
      var head = message.authenticate;
      if (!head) {
        head = this.dialog.authenticate;
      } else {
        this.dialog.authenticate = head;
      }
      this.realm = head.realm;
      this.nonce = head.nonce;
      this.cnonce = head.cnonce;
      this.qop = head.qop;
      this.algorithmName = head.Digestalgorithm ? head.Digestalgorithm : "md5";
      if (message.rawBody) {
        this.entity_body = message.rawBody;
      }
      switch (this.algorithm.toLowerCase()) {
      case "md5":
        this.algorithm = new Digest(this);
        this.response = this.algorithm.generateResponse(message.method);
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
      let line = this.algorithm.name+" username=" + stringify(this.userName) + ", realm=" + stringify(this.realm) + ", nonce=" + stringify(this.nonce) + ", uri=" + stringify(this.uri) + ", algorithm=" + this.algorithmName + ", response=" + stringify(this.response);
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
