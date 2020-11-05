
/**
 *	@class appController
 *	@constructor
 *	@param {class} container
 *	@param {class} context
 */
class wsController extends nodefony.Controller {

  constructor(container, context) {
    super(container, context);
    // start session
    this.startSession();
  }

/**
 *    @Route ("/ws",
 *      name="websocket",requirements={"protocol" = "sip"})
      @Method ({"WEBSOCKET"})
 */
  websocketAction(message) {
    switch (this.method) {
      case "WEBSOCKET":
        if (message) {
          let info = `websocket message type :  ${message.type}`;
          this.log(info, "INFO");
          //this.log(message, "INFO");
          setTimeout(()=>{
            let res = JSON.parse(message.utf8Data);
            res.data = {ok:true}
            this.context.send(JSON.stringify(res))
          }, 1000)
          //this.context.send(message.utf8Data)
          //JSON.parse( message.utf8Data )
        } else {
          this.log(`handShake`, "INFO");
          this.log(this.query);
          this.log(`Protocol accept ${this.context.acceptedProtocol}`, "INFO");
          //this.log(this.getRoute())
          this.context.send(JSON.stringify({
            handShake:"ok",
            protocol:this.context.acceptedProtocol,
            route:this.getRoute(),
            query:this.query,
          }));
        }
        break;
      default:
        throw new nodefony.Error("Bad request");
    }
  }
}

module.exports = wsController;
