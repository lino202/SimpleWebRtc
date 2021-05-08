# SimpleWebRtc


A WebRTC system which contains implementations of:
- Signaling Server
- Web client
- Android React Native application which wraps an specific fork of react-native-webrtc
- Support Local Stream takePicture, zoom and flashlight for mobile client
- Signaling and web server are implemented using docker-compose

## Dependecies

- Android studio
- Docker and Docker-Compose
- React Native


## Installation

  ```bash
  git clone https://github.com/lino202/SimpleWebRtc
  ```

  ### Web client and signaling server
  You should change the address for the signaling server in the following places:

  ```js
  //SimpleWebRtc/webSignaling/web/js/client.js
  const wsAddress = 'ws://192.168.0.20:9090'   //CHANGE!!
  ```
  ```js
  //SimpleWebRtc/mobile/WebRtcMobile/src/App.js
  const wsAddress = 'ws://192.168.0.20:9090'   //CHANGE!!
  ```


  Then, run the application

  ```bash
  cd SimpleWebRtc/webAndSignaling
  docker-compose up
  ```
  Check http://localhost:80

  ### Android Client

  ```bash
  cd SimpleWebRtc/mobile
  mkdir native_modules 
  cd native_modules
  git clone  https://github.com/lino202/react-native-webrtc
  cd ../WebRtcMobile
  yarn install
  ```
  You should be able to build succesfully the application and if you connect your device (check that your phone is correctly connected with ```adb devices```) and try to load the app by firstly starting the metro server

  ```bash
  yarn start
  ```

  Open a new terminal in path/to/project/SimpleWebRtc/mobile/webRtcMobile and build and load the app

  ```bash
  yarn android
  ```

Try to call your web user!! 

## Usage and clarifications

Only peer to peer comunications are suppported. As this is a proof of concept just communcation inside the LAN can be achieved. For connecting with another computer inside the LAN using http you should enable unsecure contexts on Firefox or Chrome. 

Signaling server runs in the localhost:9090 and web client in localhost:80. 

Photos taken in the mobile app would be saved in the folder /Pictures inside the smartphone. 

Permissions have to be granted to the mobile app by the user for using camera, microphone and storage. Usually if the photos are not being saved is because the permission has not been granted yet. Then, you should close the app go to your settings, Apps, search for the WebRtcMobile app and under permissions enable storage.

Currently only the old camera API is supported. Future work could be implementing features for Camera2 API

Picture resolution is lower than the normal camera application as it takes the picture from the webrtc stream.


## Related projects

The adjusted [react-native-webrtc](https://github.com/lino202/react-native-webrtc) in which this application is based on, allows extra features as takePicture, setZoom and switch Flashlight. This work is based on information found in forums and issues discussions of the react-native-webrtc original module.


