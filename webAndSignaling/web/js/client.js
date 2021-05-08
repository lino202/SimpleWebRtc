//GLOBAL VARIABLES--------------------------------------------------------------------
var name = null; 
var remoteName = null;
const configuration = {"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]};  //using Google public stun server 
const wsAddress = 'ws://192.168.0.20:9090'     //CHANGE!!
 
var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPage = document.querySelector('#callPage'); 
var remoteNameInput = document.querySelector('#remoteNameInput');
var callBtn = document.querySelector('#callBtn'); 

var hangUpBtn = document.querySelector('#hangUpBtn');
  
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo'); 

var errorElement = document.querySelector('#errorMsg');
var consoleElement = document.querySelector('#consoleMsg');
var pc; 
var stream;

var constraints = window.constraints = {audio: true, video: true};
  
callPage.style.display = "none";
hangUpBtn.disabled = true;


//SGINALING------------------------------------------------------------------------
var ws = new WebSocket(wsAddress);
  
ws.onopen = function () { 
   console.log("Connected to the signaling server"); 
};
  
//when we got a message from a signaling server 
ws.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
   var data = JSON.parse(msg.data); 
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
ws.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (remoteName) { 
      message.name = remoteName; 
   } 
	
   ws.send(JSON.stringify(message)); 
};

//LISTENERS------------------------------------------------------------------
// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) { 
   name = usernameInput.value;
	
   if (name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
	
});


//initiating a call 
callBtn.addEventListener("click", async function () { 
   remoteName = remoteNameInput.value;
	
   if (remoteName.length > 0) { 
	

      await startPC();

      // create an offer 
      pc.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         pc.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });
		
   } 
});

//hang up 
hangUpBtn.addEventListener("click", function () { 

   send({ 
      type: "leave" 
   });  
	
   handleLeave(); 
});
  

//FUNCTIONS----------------------------------------------------------
function handleLogin(success) { 

   if (success == false) { 
      alert("Ooops...try a different username"); 
   } else { 
      loginPage.style.display = "none"; 
      callPage.style.display = "block";

      navigator.mediaDevices.getUserMedia(constraints)
      .then(function(Mystream) {
         stream = Mystream;
         

         var videoTracks = stream.getVideoTracks();
         consoleMsg('Got stream with constraints:' + JSON.stringify(constraints));
         consoleMsg('Using video device: ' + JSON.stringify(videoTracks[0].label));
         stream.onended = function() {
               consoleMsg('Stream ended');
         };
         
         
         localVideo.srcObject = stream;
      })
      .catch(function(error) {
         if (error.name === 'ConstraintNotSatisfiedError') {
               errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
                  constraints.video.width.exact + ' px is not supported by your device.');
         } else if (error.name === 'PermissionDeniedError') {
               errorMsg('Permissions have not been granted to use your camera and ' +
               'microphone, you need to allow the page access to your devices in ' +
               'order for the demo to work.');
         }
         errorMsg('getUserMedia error: ' + error.name, error);
         });

      }
}

function startPC(){

   
   pc = new RTCPeerConnection(configuration); 
      
   // setup stream listening 
   pc.addStream(stream); 
      
   //when a remote user adds stream to the peer connection, we display it 
   pc.onaddstream = function (e) { 
      remoteVideo.srcObject = e.stream; 
   };
      
   // Setup ice handling 
   pc.onicecandidate = function (event) { 
      if (event.candidate) { 
      send({ 
            type: "candidate", 
            candidate: event.candidate 
      }); 
      } 
   };

   callBtn.disabled = true;
   hangUpBtn.disabled = false;
   remoteNameInput.disabled = true;
}

function errorMsg(msg, error) {
   errorElement.innerHTML += '<p>' + msg + '</p>';
   if (typeof error !== 'undefined') {
      console.error(error);
   }
}
    
function consoleMsg(msg) {
   consoleElement.innerHTML += '<p>' + msg + '</p>';
}
    
  

  
//when somebody sends us an offer 
async function handleOffer(offer, name) { 
         
   remoteName = name;
   remoteNameInput.value = remoteName;
   
   await startPC();
   pc.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   pc.createAnswer(function (answer) { 
      pc.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};
  
//when we got an answer from a remote user
function handleAnswer(answer) { 
   pc.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
   pc.addIceCandidate(new RTCIceCandidate(candidate)); 
};
   

function handleLeave() { 
   remoteName = null; 
   remoteVideo.src = null; 	
   pc.close(); 
   callBtn.disabled = false;
   hangUpBtn.disabled = true;
   remoteNameInput.disabled = false;
   remoteNameInput.value = null;

};