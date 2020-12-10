/**
 *	@class appController
 *	@constructor
 *	@param {class} container
 *	@param {class} context
 */
class webrtcController extends nodefony.Controller {

  constructor(container, context) {
    super(container, context);
    // start session
    this.startSession();
    this.webrtc = this.get("webrtc");
  }

  /**
   *    @Route ("/webrtc/demo/{name}",
   *      name="webrtc")
   */
  indexAction(name) {
    return this.render("app::webrtc.html.twig", {
      name: name,
    });
  }

  /**
   *    @Route ("/webrtc/ws",
   *      name="webrtc-ws")
   */
  webrtcAction(message) {
    switch (this.method) {
    case "WEBSOCKET":
      if (message) {
        return this.webrtc.handle(JSON.parse(message.utf8Data), message.utf8Data, this.context);
      }
      this.webrtc.handleConnection(this.query, this.context)
      break;
    default:
      throw new nodefony.Error("Bad request");
    }
  }
}

module.exports = webrtcController;
