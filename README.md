
<p align="center">
  <img src="https://github.com/nodefony/nodefony/raw/master/src/nodefony/bundles/framework-bundle/Resources/public/images/nodefony-logo.png"><br>
</p>
<h1 align="center">NODEFONY CLIENT</h1>

# Webpack Analyzer

<p align="center">
  <img src="https://github.com/nodefony/nodefony-client/raw/main/tools/img/webpack.png">
</p>

# Library Install
```bash
$ npm install nodefony-client
#or
$ yarn add nodefony-client
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
  import nodefony from 'nodefony-client';
  or
  import {medias, Events, Service} from 'nodefony-client';
```

# Base Library
## Events
## Syslog
## services
## Containers
