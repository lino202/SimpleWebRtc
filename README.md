# SimpleWebRtc


A WebRTC system which contains implementations of:
- Signaling Server
- Web client
- Android React Native application which wraps an specific fork of react-native-webrtc
- Support Local Stream takePicture, zoom and flashlight for mobile client
- Signaling and web server are contained in docker compose

## Dependecies

- Android studio
- Docker and Docker-Compose
- React Native


## Installation

  - Clone the repo
  - Change websocket's address in web and mobile apps
  - Launch docker-compose inside /webAndSignaling folder
  - Check (http://localhost:80)
  - Install mobile app and its dependecies with npm install and manual link the right react-native-webrtc module (https://github.com/lino202/react-native-webrtc), which you need to clone and set as the module to use.


## Usage
Only peer to peer comunications are suppported. As this is a POC just within LAN communication can be achieved.

Signaling server runs in the localhost:9090 and web client in localhost:80. 

Mobile phone has to be inside the same LAN as localhost and its websocket url must be changed to the corrrect one



## Related projects

The adjusted [react-native-webrtc](https://github.com/lino202/react-native-webrtc) in which this application is based on, allows extra features as takePicture, setZoom and switch Flashlight.


