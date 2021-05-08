import React from 'react';
import {View, SafeAreaView, Button, StyleSheet, TextInput, Text} from 'react-native';
import Slider from '@react-native-community/slider'
import {RTCPeerConnection, RTCView, mediaDevices,RTCSessionDescription, RTCIceCandidate} from 'react-native-webrtc';

const configuration = {iceServers: [{ "url": "stun:stun2.1.google.com:19302" }]};
const wsAddress  = 'ws://192.168.0.20:9090'    //CHANGE!!

export default class App extends React.Component{
  constructor(){
    super();

    this.pc = null;
    this.myname = null;
    this.remoteName = null;
    this.facing = null;
    this.slider = React.createRef();
    this.state = {
      localStream: null,
      remoteStream: null,
      isMuted: false,
      zoom: 0,
    }

    this.login=this.login.bind(this);
    this.startCall=this.startCall.bind(this);
    this.setZoom = this.setZoom.bind(this);
    this.switchFlash = this.switchFlash.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.stopCall = this.stopCall.bind(this);
    this.takePicture = this.takePicture.bind(this);
    this.startPC = this.startPC.bind(this);

    //Signaling
    this.ws = new WebSocket(wsAddress);
    this.handleLeave = this.handleLeave.bind(this);
    this.handleAnswer = this.handleAnswer.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleOffer = this.handleOffer.bind(this);
    this.handleCandidate = this.handleCandidate.bind(this);
    this.send = this.send.bind(this);

    this.ws.onopen = () => {
      console.log("WS Connected");
    }

    this.ws.onmessage = (message) =>{
      console.log("Got message", message.data);
      
      var data = JSON.parse(message.data); 
      
      switch(data.type) { 
        case "login": 
            this.handleLogin(data.success); 
            break; 
        //when somebody wants to call us 
        case "offer": 
            this.handleOffer(data.offer, data.name); 
            break; 
        case "answer": 
            this.handleAnswer(data.answer); 
            break; 
        //when a remote peer sends an ice candidate to us 
        case "candidate": 
            this.handleCandidate(data.candidate); 
            break; 
        case "leave": 
            this.handleLeave(); 
            break; 
        default: 
            break; 
      } 

    };

    this.ws.onerror = function (err) { 
      console.log("Got error", err); 
    };

  }


  async login(){

    if (this.myname.length > 0){
      this.send({ type: "login", name: this.myname }); 
    }else{
      console.log("Cannot Login name is wrong");
      return;
    }

    let isFront = true;
    const devices = await mediaDevices.enumerateDevices();

    this.facing = isFront ? 'front' : 'environment';
    const videoSourceId = devices.find(device => device.kind === 'videoinput' && device.facing === this.facing);
    const facingMode = isFront ? 'user' : 'environment';
    const constraints = {
      audio: true,
      video: {
        mandatory: {
          minWidth: 500, // Provide your own width, height and frame rate here
          minHeight: 300,
          minFrameRate: 30,
        },
        facingMode,
        optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
      },
    };

    const newStream = await mediaDevices.getUserMedia(constraints);
    this.setState({localStream: newStream});
  }


  async startCall(){
	
    if (this.remoteName.length > 0) { 
   
      await this.startPC()

      this.pc.createOffer().then(offer => {
        this.pc.setLocalDescription(offer).then(() => {
          this.send({type: "offer", offer: offer}); 
        });
      });
  
     
    }else{
      console.log("Cannot start call remote user does not exist"); 
    }
  }

  switchCamera(){
    this.state.localStream.getVideoTracks().forEach(track => track._switchCamera());
    if (this.facing == "front") this.facing = "environment";
    else if (this.facing == "environment") this.facing = "front";
    this.slider.current.setNativeProps({value: 0})
  }

  setZoom(percentage){
    this.state.localStream.getVideoTracks().forEach(track => {track.setZoom(percentage)});
    this.zoomPercentage = percentage;
  }

  switchFlash(){
    this.state.localStream.getVideoTracks().forEach(track => track.switchFlash());
  }

  // Mutes the local's outgoing audio
  toggleMute(){
    if (!this.state.remoteStream) return;
    this.state.localStream.getAudioTracks().forEach(track => {
      console.log(track.enabled ? 'muting' : 'unmuting', ' local track', track);
      track.enabled = !track.enabled;
      this.setState({isMuted: !track.enabled});
    });
  }


  
  takePicture(){

    const takePictureOptions = {
      captureTarget: 1, // memory, temp, disk or cameraRoll
      maxSize: 2000,
      maxJpegQuality: 1.0,
      streamId: this.state.localStream.getVideoTracks().filter(track => track.kind === 'video')[0].id,
    }

    this.state.localStream.getVideoTracks().forEach(track => track.takePicture(
      takePictureOptions, 
      async photoPath => {
        
        console.log(photoPath);
      },
      (error) => {console.log(error)}
      ));
  }

  stopCall(){
    this.send({ type: "leave" });
    this.handleLeave()
  }


  startPC(){


    this.pc = new RTCPeerConnection(configuration);

    // AddTrack not supported yet, so have to use old school addStream instead
    try{
    this.pc.addStream(this.state.localStream);
    }catch(error){
    console.error(error)
    }

    this.pc.onaddstream = e => {
    console.log('remotePC tracking with ', e);
    if (e.stream && this.state.remoteStream !== e.stream) {
        console.log('RemotePC received the stream', e.stream);
        this.setState({remoteStream: e.stream});
    }

    }

    let that = this;
    this.pc.onicecandidate = (e) => {
    try {
        console.log('LOCALPC icecandidate:', e.candidate);
        if (e.candidate) {
        that.send({type: "candidate", candidate: e.candidate});
        }
    } catch (err) {
        console.error(`Error sending to remote peer the iceCandidate: ${err}`);
    }
    };
    
  } 



  //alias for sending JSON encoded messages 
  send(message) { 
    //attach the other peer username to our messages 
    if (this.remoteName) { 
        message.name = this.remoteName; 
    } 

    this.ws.send(JSON.stringify(message)); 
  }
   
  handleLogin(success){
    if (success == false){
      console.log("Try another name"); 
    }else{
      console.log("Login Successful");
    }
  }

  //when somebody sends us an offer 
  async handleOffer(offer, name) { 
    this.remoteName = name; 
    await this.startPC();
    this.pc.setRemoteDescription(new RTCSessionDescription(offer));

    //create an answer to an offer
    try{
      const answer = await this.pc.createAnswer();
      this.pc.setLocalDescription(answer);
      this.send({type: "answer", answer: answer });

    }catch(error){console.error(error)}

  }
   
  //when we got an answer from a remote user
  handleAnswer(answer) { 
    this.pc.setRemoteDescription(new RTCSessionDescription(answer)); 
  }

  //when we got an ice candidate from a remote user 
  handleCandidate(candidate) { 
    console.log("The candidate received is " + JSON.stringify(candidate));
    this.pc.addIceCandidate(new RTCIceCandidate(candidate)); 
  }
   
  handleLeave() { 
    this.remoteName = null;
    this.pc.close();
    this.pc = null;
    this.setState({remoteStream: null}) 
  }




  //Rendering
  render(){
    return(
      <SafeAreaView style={styles.container}>
        
        {!this.state.localStream && <Button title="Connect" onPress={this.login}/>}
        {!this.state.localStream && <TextInput placeholder="Your Name" onChangeText={(text) => this.myname = text}/>}

        {this.state.localStream && !this.state.remoteStream && <TextInput placeholder="Callee Name" onChangeText={(text) => {this.remoteName = text}} />}
        {this.state.remoteStream && (<Text>{this.remoteName}</Text>)}
        {this.state.localStream && <Button title="Start Call" onPress={this.startCall} disabled={!!this.state.remoteStream} />}
        {this.state.localStream && <Button title="Photo" onPress={this.takePicture} />}
        {this.state.localStream && (
          <View style={styles.toggleButtons}>
            <Button title="Switch" onPress={this.switchCamera} />
            <Button title={`${this.state.isMuted ? 'Unmute' : 'Mute'}`} onPress={this.toggleMute} disabled={!this.state.remoteStream} />
            <Button title="Flash" onPress={this.switchFlash} />
            <Slider
            style={{width: 200, height: 40}}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="black"
            maximumTrackTintColor="blue"
            onValueChange={this.setZoom}
            ref={this.slider}
            />
          </View>
        )}
  
        <View style={styles.rtcview}>
          {this.state.localStream && <RTCView style={styles.rtc} streamURL={this.state.localStream.toURL()} />}
        </View>
        <View style={styles.rtcview}>
          {this.state.remoteStream && <RTCView style={styles.rtc} streamURL={this.state.remoteStream.toURL()} />}
        </View>

        <Button title="Stop Call" onPress={this.stopCall} disabled={!this.state.remoteStream} />
        

      

      </SafeAreaView>



    )
  }

}


//Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  text: {
    fontSize: 15,
  },
  rtcview: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '40%',
    width: '80%',
    backgroundColor: 'black',
  },
  rtc: {
    width: '80%',
    height: '100%',
  },
  toggleButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
