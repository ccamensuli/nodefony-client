import Md5 from "../../../crypto/md5.es6";

export default (nodefony) => {
  const md5 = Md5(nodefony)
  const MD5 = md5.hex_md5_noUTF8;
  //const BASE64 = stage.crypto.base64.encode ;


  const omitNull = function (data) {
    let newObject = {};
    for (let ele in data) {
      if (data[ele] !== null || data[ele] !== undefined) {
        newObject[ele] = data[ele];
      }
    }
    return newObject;
  }

  const exclude = {
    qop: true,
    nc: true,
    algorithm:true
  };


  const compileParams = function (params) {
    let parts = [];
    for (let ele in params) {
      if (typeof params[ele] === 'function') {
        continue;
      }
      let value = params[ele].replace(/"|'/, "");
      if ( ! ( ele in exclude ) ) {
        value = `"${value}"`;
      }
      let param = `${ele}=${value}`;

      //let param = i + '=' + (this._putDoubleQuotes(i) ? '"' : '') + params[i] + (this._putDoubleQuotes(i) ? '"' : '');
      parts.push(param);
    }
    return parts.join(',');
  }


  class Digest {

    constructor(challenge, body = null, authenticate) {
      this.name = "Digest";
      this.authenticate = authenticate;
      this.userName = this.authenticate.userName;
      this.password = this.authenticate.password;
      this.uri = "sip:" + this.authenticate.dialog.sip.server;
      this.nc = 0;
      this.realm = challenge.realm || "nodefony.com";
      this.nonce = challenge.nonce;
      this.cnonce = challenge.cnonce;
      this.qop = challenge.qop;
      this.opaque = challenge.opaque;
      this.entity_body = body;
    }

    generateCNONCE(qop) {
      let cnonce = false;
      let nc = false;
      if (typeof qop === 'string') {
        let cnonceHash = md5.hex_md5(Math.random().toString(36));
        this.cnonce = cnonceHash.substr(0, 8);
        this.nc = this.updateNC();
      }
    }
    updateNC() {
      let max = 99999999;
      let padding = new Array(8).join('0') + '';
      this.nc = (this.nc > max ? 1 : this.nc + 1);
      let nc = this.nc + '';
      return padding.substr(0, 8 - nc.length) + nc;
    }

    generateA1(username, realm, password, nonce, cnonce) {
      let A1 = `${username}:${realm}:${password}`;
      return MD5(A1);
    }

    generateA2(method, uri, entity_body, qop) {
      let A2 = "";
      if (!qop || qop === "auth") {
        A2 = `${method}:${uri}`;
      } else if (qop === "auth-int") {
        if (entity_body) {
          let entity = MD5(entity_body);
          A2 = `${method}:${uri}:${entity}`;
        } else {
          A2 = `${method}:${uri}`;
          //A2 = `${method}:${uri}:d41d8cd98f00b204e9800998ecf8427e`;
        }
      }
      //console.log(A2, MD5(A2))
      return MD5(A2);
    }

    generateResponse(method) {
      let tab = [];
      this.generateCNONCE(this.qop);
      let A1 = this.generateA1(this.userName, this.realm, this.password, this.nonce, this.cnonce);
      tab.push(A1);
      tab.push(this.nonce);
      if (this.cnonce) {
        tab.push(this.nc);
        tab.push(this.cnonce);
      }
      tab.push(this.qop);
      let A2 = this.generateA2(method, this.uri, this.entity_body, this.qop);
      tab.push(A2);
      return MD5(tab.join(':'));
      //return this.generate(A1, this.nonce, this.nc, this.cnonce, this.qop, A2);
    }

    getLine(response) {
      let authParams = {
        username: this.userName,
        realm: this.realm,
        nonce: this.nonce,
        uri: this.uri,
        qop: this.qop,
        algorithm: "MD5",
        opaque: this.opaque,
        response: response
      };

      authParams = omitNull(authParams);
      if (this.cnonce) {
        authParams.nc = this.nc;
        authParams.cnonce = this.cnonce;
      }
      let line = `${this.name} ${compileParams(authParams)}`;
      return line;
    }
  };

  return Digest;
};
