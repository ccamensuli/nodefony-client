 export default (nodefony) => {

   const defaultSettings = {
     protocol: "",
     timeout: 10 * 1000
   };
   /*
    *
    */
   class Websocket extends nodefony.Service {

     constructor(url, settings = defaultSettings, service = null) {
       if (settings === null) {
         settings = defaultSettings;
       }
       if (service) {
         super("Websocket", service.container, service.notificationsCenter, settings);
       } else {
         super("Websocket", null, null, settings);
       }
       this.socket = null;
       if (url) {
         this.connect(url, this.options);
       }
     }

     connect(url, settings = null) {
       let options = settings ? settings : this.options;
       if (this.socket) {
         this.log(`Socket already exist `, "WARNING");
         this.socket.close();
         this.socket = null;
       }
       try {
         this.log(`Protocol : ${options.protocol}`);
         this.socket = new window.WebSocket(url, options.protocol);
       } catch (e) {
         this.fire("onerror", e);
         this.socket = null;
         throw e;
       }
       this.socket.onmessage = this.listen(this, "onmessage");
       this.socket.onerror = this.listen(this, "onerror");
       this.socket.onopen = this.listen(this, "onopen");
       this.socket.onclose = this.listen(this, "onclose");
       return this.socket;
     }

     close(code = 1000, reason) {
       this.socket.close(code, reason);
     }

     send(data) {
       return this.socket.send(data);
     }

     sendAsync(data, timeout = null) {
       return new Promise((resolve, reject) => {
         let message = {
           nodefonyId: nodefony.getUuid(),
           data: data,
           timeout: timeout || this.options.timeout || defaultSettings.timeout,
           timeoutid: null
         };
         message.timeoutid = setTimeout(() => {
           this.removeListener("onmessage", events)
           let error = new Error(`timeout messageid : ${message.nodefonyId}`);
           return reject(error);
         }, message.timeout);
         let events = (event) => {
           let result = null
           try {
             result = JSON.parse(event.data);
           } catch (e) {
             //this.log(e, "WARNING");
             return;
           }
           if (result && result.nodefonyId) {
             if (result.nodefonyId === message.nodefonyId) {
               let id = result.timeoutid || message.timeoutid;
               if (id) {
                 clearTimeout(id)
               }
               this.removeListener("onmessage", events);
               return resolve(result.data)
             }
           }
         };
         this.on("onmessage", events);
         try {
           this.socket.send(JSON.stringify(message));
         } catch (e) {
           if (message.timeoutid) {
             clearTimeout(message.timeoutid)
           }
           this.removeListener("onmessage", events)
           throw e;
         }
       })
     }

     destroy(data) {
       delete this.socket;
       this.socket = null;
       this.removeAllListeners();
     }
   };

   nodefony.WebSocket = Websocket;

   return Websocket;
 };
