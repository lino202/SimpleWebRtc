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

  ### Web client and signaling server

  ```bash
  git clone https://github.com/lino202/SimpleWebRtc
  ```

  You should change the address for the signaling server in the following places:

  ```js
  #SimpleWebRtc/webSignaling/web/js/client.js
  const wsAddress = 'ws://192.168.0.20:9090'   //CHANGE!!
  ```
  ```js
  #SimpleWebRtc/mobile/WebRtcMobile/src/App.js
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
  You should be able to build succesfully the application and if you connect your device (check that your phone is correctly connected with ```bash adb devices```) and try to load the app by firstly starting the metro server

  ```bash
  yarn start
  ```


  Open a new terminal in path/SimpleWebRtc/mobile/webRtcMobile and build and load the app 
  ```bash
  yarn android
  ```



## Usage
Only peer to peer comunications are suppported. As this is a proof of concept just communcation inside the LAN can be achieved.

Signaling server runs in the localhost:9090 and web client in localhost:80. 



## Related projects

The adjusted [react-native-webrtc](https://github.com/lino202/react-native-webrtc) in which this application is based on, allows extra features as takePicture, setZoom and switch Flashlight.


