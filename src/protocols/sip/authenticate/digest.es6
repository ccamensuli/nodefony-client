import Md5 from "../../../crypto/md5.es6" ;

export default (nodefony) => {
  const md5 = Md5(nodefony)
  const MD5 = md5.hex_md5_noUTF8;
  //const BASE64 = stage.crypto.base64.encode ;

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

  class Digest {

    constructor(authenticate){
      this.name = "Digest";
      this.authenticate = authenticate;
      this.authenticate.parser = Digest.parser ;
    }

    generateA1 (username, realm, password, nonce, cnonce) {
      var A1 = null;
      if (cnonce) {
        A1 = username + ":" + realm + ":" + password + ":" + nonce + ":" + cnonce;
      } else {
        A1 = username + ":" + realm + ":" + password; //+ ":" + nonce ;
      }
      //console.log(A1)
      return MD5(A1);
    }

    generateA2(method, uri, entity_body, qop) {
      var A2 = "";
      if (!qop || qop === "auth") {
        A2 = method + ":" + uri;
      } else if (qop === "auth-int") {
        if (entity_body) {
          var entity = MD5(entity_body);
          A2 = method + ":" + uri + ":" + entity;
        } else {
          A2 = method + ":" + uri + ":" + "d41d8cd98f00b204e9800998ecf8427e";
        }
      }
      //console.log(A2)
      return MD5(A2);
    }

    generate(A1, nonce, noncecount, cnonce, qop, A2) {
      var res = "";
      if (qop === "auth" || qop === "auth-int") {
        res = A1 + ":" + nonce + ":" + noncecount + ":" + cnonce + ":" + qop + ":" + A2;
      } else {
        res = A1 + ":" + nonce + ":" + A2;
      }
      //console.log(res)
      return MD5(res);
    }

    static parser(data){
      return parserAuthenticate(data);
    }

    generateResponse(method) {
      let A1 = this.generateA1(this.userName, this.realm, this.password, this.nonce, this.cnonce);
      let A2 = this.generateA2(method, this.uri, this.entity_body, this.qop);
      return this.generate(A1, this.nonce, this.nonceCount, this.cnonce, this.qop, A2);
    }
  };

  return Digest ;
};
