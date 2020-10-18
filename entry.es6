/*
 *
 *	The CeCILL-B License
 *
 *	Copyright (c)
 *
 *
 *	This software is a computer program whose purpose is to [describe
 *	functionalities and technical features of your software].
 *
 *	This software is governed by the CeCILL-B license under French law and
 *	abiding by the rules of distribution of free software.  You can  use,
 *	modify and/ or redistribute the software under the terms of the CeCILL-B
 *	license as circulated by CEA, CNRS and INRIA at the following URL
 *	"http://www.cecill.info".
 *
 *	As a counterpart to the access to the source code and  rights to copy,
 *	modify and redistribute granted by the license, users are provided only
 *	with a limited warranty  and the software's author,  the holder of the
 *	economic rights,  and the successive licensors  have only  limited
 *	liability.
 *
 *	In this respect, the user's attention is drawn to the risks associated
 *	with loading,  using,  modifying and/or developing or reproducing the
 *	software by the user in light of its specific status of free software,
 *	that may mean  that it is complicated to manipulate,  and  that  also
 *	therefore means  that it is reserved for developers  and  experienced
 *	professionals having in-depth computer knowledge. Users are therefore
 *	encouraged to load and test the software's suitability as regards their
 *	requirements in conditions enabling the security of their systems and/or
 *	data to be ensured and,  more generally, to use and operate it in the
 *	same conditions as regards security.
 *
 *	The fact that you are presently reading this means that you have had
 *	knowledge of the CeCILL-B license and that you accept its terms.
 *
 */
// CORE
//import "regenerator-runtime/runtime";
//import "core-js/stable";
import nodefony from './src/nodefony.es6';

import events from './src/core/events.es6';
events(nodefony);

import error from './src/core/error.es6';
error(nodefony);

import syslog from './src/core/syslog/syslog.es6';
syslog(nodefony);

import container from './src/core/container.es6';
container(nodefony);

import service from './src/core/service.es6';
service(nodefony);

import storage from './src/core/storage/storage.es6';
storage(nodefony);

import websocket from './src/transports/websocket/websocket.es6';
websocket(nodefony);

import api from './src/api/api.es6';
api(nodefony);

nodefony.load();


// socket
// import(/* webpackPrefetch: true , webpackChunkName: "socket" */'./src/transports/socket.es6')
// .then((socket) => {
//   return socket.default(nodefony);
// });

// // medias
// import(/* webpackPrefetch: true , webpackChunkName: "medias" */'./src/medias/medias.es6')
// .then((medias) => {
//   return medias.default(nodefony);
// });
// // medias webaudio
// import(/* webpackPrefetch: true , webpackChunkName: "webAudio" */'./src/medias/webAudio/webAudio.es6')
// .then((audio) => {
//   return audio.default(nodefony);
// });
// import(/* webpackPrefetch: true , webpackChunkName: "audioBus" */'./src/medias/webAudio/audioBus.es6')
// .then((audioBus) => {
//   return audioBus.default(nodefony);
// });
// import(/* webpackPrefetch: true , webpackChunkName: "track" */'./src/medias/webAudio/track.es6')
// .then((track) => {
//   return track.default(nodefony);
// });
// import(/* webpackPrefetch: true , webpackChunkName: "mixer"*/'./src/medias/webAudio/mixer.es6')
// .then((mixer) => {
//   return mixer.default(nodefony);
// });


//import webrtc from './src/medias/webrtc/webrtc.es6';
//nodefony.medias.webrtc = webrtc(nodefony);
//import transaction from './src/medias/webrtc/transaction.es6';
//nodefony.medias.webrtcTransaction = transaction(nodefony);
//import user from './src/medias/webrtc/user.es6';
//nodefony.medias.userMedia = user(nodefony);


export default nodefony;
