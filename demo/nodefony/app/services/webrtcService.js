module.exports = class webrtc extends nodefony.Service {

  constructor(container) {
    super("webrtc", container);
    this.peers= new Map();
  }
  handle(message, raw, context){
    return this.broadcast(raw, message.from);
  }

  handleConnection(query, context){
    this.peers.set(query.name, context);
    context.on("onClose",()=>{
      this.peers.delete(query.name);
    });
    let message = {
      query,
      method: "handshake",
      peer: query.name
    };
    return context.send(JSON.stringify(message));
  }

  broadcast( message, exclude){
    this.peers.forEach((context, name) => {
      if (name === exclude){
        return null;
      }
      return context.send(message);
    });
  }
};
