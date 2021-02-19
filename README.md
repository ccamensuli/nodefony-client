
<p align="center">
  <img src="https://github.com/nodefony/nodefony/raw/master/src/nodefony/bundles/framework-bundle/Resources/public/images/nodefony-logo.png"><br>
</p>
<h1 align="center">NODEFONY CLIENT</h1>

![nodefony-client CI](https://github.com/nodefony/nodefony-client/workflows/nodefony-client%20CI/badge.svg?branch=main)

# Library Install
```bash
$ npm install nodefony-client
#or
$ yarn add nodefony-client
```

# Webpack Analyzer

<p align="center">
  <img src="https://github.com/nodefony/nodefony-client/raw/main/tools/img/webpack.png">
</p>

```js

console.log(nodefony)
{
  version: "6.0.0-beta.4",
  environment: "development",
  isRegExp: ƒ,
  isObject: ƒ,
  isFunction: ƒ,
  Api: ƒ Api()
  Container: ƒ Container(services, parameters)
  Error: ƒ nodefonyError(message, code)
  Events: ƒ Notification(settings, context)
  ExtendedScope: ƒ ExtendedScope(name, parent)
  PDU: ƒ PDU(pci, severity, moduleName, msgid, msg, date)
  Scope: ƒ Scope(name, parent)
  Service: ƒ Service(name, container, notificationsCenter)
  Socket: ƒ Socket(url)
  Storage: ƒ Storage(name)
  Syslog: ƒ Syslog(settings)
  URL: {parse: ƒ, resolve: ƒ, resolveObject: ƒ, format: ƒ, Url: ƒ}
  WebSocket: ƒ Websocket(url)
  browser: {flag: "chrome", name: "Chrome", version: "86.0.4240.80"}
  environment: "development"
  inspect: ƒ inspect(obj, opts)
  isArray: ƒ isArray(ar)
  isFunction: ƒ isFunction(arg)
  isNullOrUndefined: ƒ isNullOrUndefined(arg)
  isObject: ƒ isObject(arg)
  isRegExp: ƒ isRegExp(re)
  isUndefined: ƒ isUndefined(arg)
  medias: Medias {MediaStream: ƒ}
  nativeWebSocket: true
  protocols: {Bayeux: ƒ}
  util: {types: {…}, format: ƒ, deprecate: ƒ, debuglog: ƒ, inspect: ƒ, …}
  version: "6.0.0-beta.4"
  webAudio: {audioContext: ƒ, Mixer: ƒ, AudioBus: ƒ, Track: ƒ}  
}
```

# Use With CDN
## cdn.jsdelivr.net

### latest base library
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/nodefony-client"></script>
```
### latest library + chunks
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/nodefony-client/dist/nodefony.js?medias=true&socket=true"></script>
```
### version library + chunks
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/nodefony-client@6.0.0/dist/nodefony.js?medias=true&socket=true"></script>
```

## unpkg.com

### latest base library
```html
<script type="text/javascript" src="https://unpkg.com/nodefony-client"></script>
```
### latest library + chunks
```html
<script type="text/javascript" src="https://unpkg.com/nodefony-client@6.0.0/dist/nodefony.js?medias=true&socket=true"></script>
```
### version library + chunks
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/nodefony-client@6.0.0/dist/nodefony.js?medias=true&socket=true"></script>
```

### CDN Available Library Chunks query : ?medias&sip
```  
medias
socket
webaudio
sip
```
### CDN Available Library environment query : ?debug=true&environment=development
```  
debug = sip,socket,webaudio,medias | true | flase
environment = production | development
```

# Use Nodefony-client In Webpack
##  Release
```js
  // import base library
  import nodefony from "nodefony-client";
  // import chunk medias
  import media from "nodefony-client/dist/medias";
  media(nodefony);
  // import chunk webaudio
  import webaudio from "nodefony-client/dist/webaudio";
  webaudio(nodefony);
  // import chunk socket
  import socket from "nodefony-client/dist/socket";
  socket(nodefony);
  window.nodefony = nodefony;
```

## CommonJS modules
```js
const nodefony = require('nodefony-client')
//chunk
const socket = require("nodefony-client/dist/socket");
socket.default(nodefony);
```

## Sources
```js
const source_dir = path.resolve("<path.to.sources>")
import Nodefony from `${source_dir}/src/nodefony.js`;
const nodefony = new Nodefony(process.env.NODE_ENV, process.env.NODE_DEBUG);
import Media from `${source_dir}/src/medias/medias.js`;
Media(nodefony);
import Webaudio from `${source_dir}/src/medias/webaudio/webaudio.js`;
Webaudio(nodefony);
import Socket from `${source_dir}/src/transports/socket/socket.js`;
Socket(nodefony);
window.nodefony = nodefony;
```

# Base Library
## Events
```js
const notificationsCenter = new nodefony.Events();

notificationsCenter.on("myEvent", (count, args) => {
  console.log(count, args)
});

const obj = {foo:"bar"};
let i = 0;
notificationsCenter.emit("myEvent", i, obj);
notificationsCenter.emit("myEvent", ++i, obj);

// 0 {foo: "bar"}
// 1 {foo: "bar"}
```

## Service
```js
// nodefony.Service => (name, container = null, events = null, settings = {})

class myService extends nodefony.Service {
  constructor(){
    super("myService");
  }
}
const instance = new myService();

console.log(instance)
{
  container: Container {scope: {…}, services: C…r.protoService, parameters: C…r.protoParameters, protoService: ƒ, protoParameters: ƒ}
  name: "myService"
  notificationsCenter: Events {_events: {…}, _eventsCount: 1, _maxListeners: 20}
  options: {}
  settingsSyslog: {moduleName: "myService", defaultSeverity: "INFO"}
  syslog: Syslog {_events: {…}, _eventsCount: 0, _maxListeners: undefined, settings: {…}, ringStack: Array(0), …}
}
```

## Syslog
```js
const syslog = new nodefony.Syslog();
syslog.init();
syslog.log('info', "INFO");
syslog.log('debug', "DEBUG");
syslog.log('notice', "NOTICE");
syslog.log('warning', "WARNING");
syslog.log('error', "ERROR");
syslog.log('alert', "ALERT");
syslog.log('critic', "CRITIC");
syslog.log('emergency', "EMERGENCY");

```
