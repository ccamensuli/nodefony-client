export default (nodefony) => {

  const regHeaders = {
    line: /\r\n|\r|\n/,
    headName: /: */,
    Allow: /, */,
    Via: /; */,
    CallId: /^(.*)@.*$/,
    algorithm: /= */,
    fromTo: /<sip:(.*)@(.*)>/,
    fromToG: /(.*)?<sip:(.*)@(.*)>/,
    contact: /.*<(sips?:.*)>(.*)?$/
  };

  const parsefromTo = function (type, value) {
    try {
      var sp = value.split(";");
      this.message[type + "Tag"] = null;
      var res = sp.shift();
      var res2 = regHeaders.fromTo.exec(res);
      //console.log(regHeaders.fromToG.exec(res))
      //console.log(res2)
      this.message[type + "Name"] = (res2.length > 2) ? res2[1].replace(/ |\n|\r/g, "").replace(/"/g, "") : "";
      this.message[type] = res2[1].replace(" ", "") + "@" + res2[2].replace(/ |\n|\r/g, "");
      var ret = regHeaders.fromToG.exec(res);
      if (ret && ret[1]) {
        var displayName = ret[1].replace(/"/g, "");
        //this.message[type+"Name"] = displayName ;
        this.message[type + "NameDisplay"] = displayName;
        //console.log(displayName)
      }

      for (var i = 0; i < sp.length; i++) {
        var res3 = sp[i].split("=");
        if (res3[0].replace(/ |\n|\r/g, "") === "tag") {
          this.message[type + "Tag"] = res3[1];
        } else {
          this.message[res3[0]] = res3[1];
        }
      }
      return value;
    } catch (e) {
      throw e;
    }
  };



  class SipHeader {

    constructor(message, header) {
      this.rawHeader = {};
      this.message = message;
      this.method = null;
      this.firstLine = null;
      this.branch = null;
      this.Via = [];
      this.routes = [];
      this.recordRoutes = [];
      if (header && typeof header === "string") {
        try {
          this.parse(header);
        } catch (e) {
          //throw new Error("PARSE ERROR MESSAGE SIP", 500);
          throw e;
        }
      }
    }

    parse(header) {
      let tab = header.split(regHeaders.line);
      let type = tab.shift();
      this.firstLine = type.split(" ");
      tab.forEach( (ele) => {
        var res = regHeaders.headName.exec(ele);
        var size = res[0].length;
        var headName = res.input.substr(0, res.index);
        var headValue = res.input.substr(res.index + size);
        this.rawHeader[headName] = headValue;
        var func = "set" + headName;
        if (func === "setVia") {
          var index = this.Via.push(headValue);
          this[headName][index - 1] = this[func](headValue, ele);
        } else {
          this[headName] = headValue;
          if (this[func]) {
            try {
              this[headName] = this[func](headValue);
            } catch (e) {
              this.message.sip.logger("Parse : " + headName, "ERROR");
              throw e;
            }
          }
        }
      });
      if (!this["Content-Type"]) {
        this.message.contentType = null;
      } else {
        this.message.contentType = this["Content-Type"];
      }
    }

    setFrom(value) {
      parsefromTo.call(this, "from", value);
      return value;
    }

    setTo(value) {
      parsefromTo.call(this, "to", value);
      return value;
    }

    "setWWW-Authenticate"(value) {
      //console.log("passsss", this.message , this.message.sip , this.message.sip.authenticateRegister)
      this.message.authenticate = value ;
      /*if (this.message.sip.authenticateRegister){
        this.message.authenticate = this.message.sip.authenticateRegister.parser(value);
      }*/
      //this.message.authenticate = parserAuthenticate(value);
      /*var ele ={};
    		  	var res = value.split(",")
    		  	for (var i=0 ; i < res.length ;i++){
    		  	var ret = regHeaders.algorithm.exec(res[i]);
    		  	var size = ret[0].length;
    		  	var headName = ret.input.substr(0,ret.index).replace(" ","");
    		  	var headValue = ret.input.substr(ret.index+size).replace(/"/g,"");
    		  	ele[headName] = headValue.replace(/"/g,"");
    		  	}
    		  	this.message.authenticate = ele ;*/
      return value;
    }

    "setProxy-Authenticate"(value) {
      if(this.message.sip.authenticateRegister){
        this.message.authenticate = this.message.sip.authenticateRegister.parser(value);
      }
      //this.message.authenticate = parserAuthenticate(value);
      return value;
    }

    "setRecord-Route"(value) {
      this.recordRoutes.push(value);
      return value;
    }

    "setRoute"(value) {
      this.routes.push(value);
      return value;
    }

    setDate(value) {
      try {
        this.message.date = new Date(value);
      } catch (e) {
        this.message.date = value;
      }
      return value;
    }

    "setCall-ID"(value) {
      this.message.callId = value;
      return value;
      /*this.callIdRaw = value ;
    		  	var res = regHeaders.CallId.exec(value);
    		  	if (res){
    		  	this.message.callId =res[1];
    		  	return res[1];

    		  	}else{
    		  	this.message.callId =value;
    		  	return value;
    		  	}*/
    }

    setCSeq(value) {
      var res = value.split(" ");
      this.message.cseq = parseInt(res[0], 10);
      this.message.method = res[1];
      return value;
    }

    setContact(value) {
      var parseValue = regHeaders.contact.exec(value);
      if (parseValue) {
        this.message.contact = parseValue[1];
        if (parseValue[2]) {
          var clean = parseValue[2].replace(/^;(.*)/, "$1");
          var sp = clean.split(";");
          for (var i = 0; i < sp.length; i++) {
            var res = sp[i].split("=");
            if (!res) {
              continue;
            }
            var name = res[0].toLowerCase();
            if (name === "expires") {
              this["contact-" + name] = res[1];
            }
          }
        }
      } else {
        throw new Error("Contact parse error : " + value);
      }
      return value;
    }

    setAllow(value) {
      if (value) {
        return this.Allow.split(regHeaders.Allow);
      } else {
        return this.Allow;
      }
    }

    setSupported(value) {
      if (value) {
        return this.Supported.split(regHeaders.Allow);
      } else {
        return this.Supported;
      }
    }

    setVia(value, raw) {
      if (value) {
        var res = value.split(regHeaders.Via);
        var obj = {
          line: Array.prototype.shift.call(res),
          raw: raw
        };
        for (var i = 0; i < res.length; i++) {
          var tab = res[i].split('=');
          if (tab) {
            if (tab[0] === "branch") {
              if (!this.branch) {
                this.branch = tab[1];
              }
            }
            obj[tab[0]] = tab[1];
          }
        }
        return obj;
      } else {
        return value;
      }
    }
  }

  return SipHeader;
};
