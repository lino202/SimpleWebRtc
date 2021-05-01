//require our websocket library 
var WebSocketServer = require('ws').Server; 

function sendTo(connection, message) { 
    connection.send(JSON.stringify(message)); 
}


//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 
 

//all connected to the server users
var users = {};
console.log("Signaling Server is up and running")
//when a user connects to our sever 
wss.on('connection', function(connection) { 
   console.log("user connected");

    //when server gets a message from a connected user 
    connection.on('message', function(message){ 
        var data;
        //accepting only JSON messages 
            try { 
                data = JSON.parse(message); 
            } catch (e) { 
                console.log("Invalid JSON"); 
                data = {}; 
            }



        //switching type of the user message 
        switch (data.type) { 
            //when a user tries to login 
            case "login": 
                console.log("User logged:", data.name); 
                    
                //if anyone is logged in with this username then refuse 
                if(users[data.name]) { 
                    sendTo(connection, { 
                        type: "login", 
                        success: false 
                    }); 
                } else { 
                    //save user connection on the server 
                    users[data.name] = connection; 
                    connection.name = data.name; 
                        
                    sendTo(connection, { 
                        type: "login", 
                        success: true 
                    });
                        
                } 
                    
                break;
                        
            default: 
                sendTo(connection, { 
                    type: "error", 
                    message: "Command not found: " + data.type 
                }); 
                    
                break; 
            
            case "offer": 
                //for ex. UserA wants to call UserB 
                console.log("Sending offer to: ", data.name); 
                 
                //if UserB exists then send him offer details 
                var callee_conn = users[data.name]; 
                 
                if(callee_conn != null){ 
                   //setting that UserA connected with UserB 
                   connection.otherName = data.name; 
                     
                   sendTo(callee_conn, { 
                      type: "offer", 
                      offer: data.offer, 
                      name: connection.name 
                   }); 
                }
                else{
                    console.log("User does not exist")
                    sendTo(connection, { 
                        type: "offer",  
                        message: "User " + data.name + " does not exist"
                     });
                }
                 
                break;


            case "answer": 
                console.log("Sending answer to: ", data.name); 
                    
                //for ex. UserB answers UserA 
                var conn = users[data.name]; 
                    
                if(conn != null) { 
                    connection.otherName = data.name; 
                    sendTo(conn, { 
                        type: "answer", 
                        answer: data.answer 
                    }); 
                }
                    
                break;

            case "candidate": 
                console.log("Sending candidate to:",data.name); 
                var conn = users[data.name]; 
                 
                if(conn != null) {
                   sendTo(conn, { 
                      type: "candidate", 
                      candidate: data.candidate 
                   }); 
                }
                 
                break;

            case "leave": 
                console.log("Disconnecting from", data.name); 
                var conn = users[data.name]; 
                conn.otherName = null; 
                 
                //notify the other user so he can disconnect his peer connection 
                if(conn != null) { 
                   sendTo(conn, { 
                      type: "leave" 
                   }); 
                } 
                 
                break;




        }    
    }); 
                        
    

    connection.on("close", function() { 
        if(connection.name) { 
            delete users[connection.name]; 
              
            if(connection.otherName) { 
               console.log("Disconnecting from ", connection.otherName); 
               var conn = users[connection.otherName]; 
               conn.otherName = null;
                  
               if(conn != null) { 
                  sendTo(conn, { 
                     type: "leave" 
                  }); 
               }  
            } 
         } 
    });

}); 