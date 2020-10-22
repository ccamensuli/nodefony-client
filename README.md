
<p align="center">
  <img src="https://github.com/nodefony/nodefony/raw/master/src/nodefony/bundles/framework-bundle/Resources/public/images/nodefony-logo.png"><br>
</p>
<h1 align="center">NODEFONY CLIENT</h1>

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
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/nodefony-client@6.0.0-beta.2/dist/nodefony.js?medias=true&socket=true"></script>
```

## unpkg.com

### latest base library
```html
<script type="text/javascript" src="https://unpkg.com/nodefony-client"></script>
```
### latest library + chunks
```html
<script type="text/javascript" src="https://unpkg.com/nodefony-client@6.0.0-beta.2/dist/nodefony.js?medias=true&socket=true"></script>
```
### version library + chunks
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/nodefony-client@6.0.0-beta.0/dist/nodefony.js?medias=true&socket=true"></script>
```


### CDN Available Chunks
```
medias
socket
webaudio
```

# Use With Webpack
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

```

# Base Library
## Events
```js
const notificationsCenter = new nodefony.Events();

```
## Syslog
```

```
## services
```js
// nodefony.Service => (name, container = null, events = null, settings = {})

class myService extends nodefony.Service {
  constructor(){
    super("myService");
  }
}
const instance = new myService();
```
## Containers
```
```
