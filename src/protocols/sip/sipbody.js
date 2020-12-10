import sdp from './sdp.js';

export default (nodefony) => {
  const Sdp = sdp(nodefony);

  class sipBody {
    constructor(message, body) {
      this.message = message;
      this.message.rawBody = body;
      this.size = this.message.contentLength;
      if (this.size !== body.length) {
        throw new Error("BAD SIZE SIP BODY ");
      }
      if (body) {
        this.parse(this.message.contentType, body);
      }
    }

    parse(type, body) {
      switch (type) {
      case "application/sdp":
        this.sdpParser(body);
        break;
      case "application/dtmf-relay":
        this.dtmfParser(body);
        break;
      default:
        this.body = body;
      }
    }

    sdpParser(body) {
      // Parser SDP
      this.body = body || "";
      if (!body) {
        this.sdp = null;
      } else {
        try {
          this.sdp = new Sdp(body);
          //console.log(this.sdp)
        } catch (e) {
          throw e;
        }
      }
    }

    dtmfParser(body) {
      // Parser DTMF
      this.body = body || "";
      if (!body) {
        this.dtmf = null;
      } else {
        // Parser dtmf
        var obj = {};
        var line = body.split("\n");
        for (var i = 0; i < line.length; i++) {
          var res = line[i].split("=");
          obj[res[0].replace(/ |\n|\r/g, "")] = res[1];
        }
        this.dtmf = obj;
      }
    }
  }

  return sipBody;
};
