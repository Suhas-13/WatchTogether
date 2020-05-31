const http = require('https');
const fs = require('fs');
var express = require('express');
var app = express();

let sessions={};
let users={};
const DEFAULT_LATENCY=300
const MAX_LATENCY=10000
const MAX_PINGS=10
const MAX_INTERVAL=15000
const MAX_PING_WAIT=6000
var bodyParser = require('body-parser');
app.use(express.json());

app.post('/create_session', (req, res) => {
    let uniqueID=req.body.uniqueID;
    let username=req.body.username;
    let currentTime=req.body.currentTime;
    let url=req.body.url;
    let playing=req.body.playing;
    let sessionID=req.body.sessionID;
    if (sessionID.length == 0 || url.length == 0 || sessionID in sessions) {
        res.sendStatus(400);
    }
    else {
        sessions[sessionID]={"users":[],"url":url,"playing":playing,"serverTime":currentTime,"latency":DEFAULT_LATENCY,"last_latency_check":undefined}
        users[uniqueID]={"sessionID":sessionID,"socketID":undefined,"currentTime":undefined,"latency":[],"average_latency":DEFAULT_LATENCY}
        res.sendStatus(200);
    }
  });
  app.post('/join_session', (req, res) => {
    let uniqueID=req.body.uniqueID;
    let username=req.body.username;
    let sessionID=req.body.sessionID;
    if (sessionID.length == 0 || (sessionID in sessions)==false) {
        res.sendStatus(400);
    }
    else {
        users[uniqueID]={"sessionID":sessionID,"socketID":undefined,"currentTime":undefined,"latency":[]}
        res.sendStatus(200);
    }
  });
  
/*
const server=http.createServer(app).listen(process.env.PORT || 80);
*/
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };
const server=http.createServer(options,app).listen(443);

const io = require('socket.io')(server, {
    path: '/socket.io',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000
  });
  io.on('connection', (socket) => {
    let unique_id=socket.handshake.query.id;
    let sid=socket.id;
    let autoPlay=socket.handshake.query.dontPlay;

    if (unique_id!=undefined && sid != undefined) {
        if (!(unique_id in users)) {
            users[unique_id]={"socketID":undefined,"sessionID":undefined,"currentTime":undefined,"latency":[]}
        }
        users[unique_id]['socketID']=sid
        sessionID=users[unique_id]['sessionID']
        if (sessionID in sessions) {
            sessions[sessionID]['users'].push(unique_id)
            socket.join(sessionID);
            io.to(sessionID).emit("pause",{"time":sessions[sessionID]['latency']-users[unique_id]['average_latency']});
            setTimeout(()=>{
                users[unique_id]['currentTime']=sessions[sessionID]['serverTime'];
                socket.emit("seek",{"time":sessions[sessionID]['latency']-users[unique_id]['average_latency'],"new_time":sessions[sessionID]['serverTime']})
                if (sessions[sessionID]['playing']) {
                    if (autoPlay) {
                        socket.emit("play",{"time":sessions[sessionID]['latency']+400})
                    }
                    else {
                        socket.emit("pause",{"time":sessions[sessionID]['latency']+400});
                    }
                }
            },DEFAULT_LATENCY); 
        }
       
        calculate_latency(sessionID);
    }
    function calculate_latency(sessionID) {
        sessions[sessionID]['last_latency_check']=(Date.now());
        for (let i=0; i<MAX_PINGS; i++) {
            io.to(sessionID).emit("latency_check",{"time":(Date.now())});
        }  
        setTimeout(()=> {
            let max_new_latency=DEFAULT_LATENCY;
            let user_list=sessions[sessionID]['users'];
            for (let i=0; i<user_list.length; i++) {
                let pings=users[user_list[i]]['latency'];
                const sum = pings.reduce((a, b) => a + b, 0);
                const current_latency = (sum / pings.length) || 0;
                console.log(user_list[i] + " latency " + current_latency);
                io.to(users[user_list[i]]['socketID']).emit("set_latency",{"latency":Math.min(current_latency,MAX_LATENCY)});
                max_new_latency=Math.max(max_new_latency,Math.min(current_latency,MAX_LATENCY));
            }
            sessions[sessionID]['latency']=max_new_latency;
            console.log("Server latency is "+ sessions[sessionID]['latency']);
        },MAX_PING_WAIT);
    }
    function check_interval(sessionID) {
        
        if (sessions[sessionID]['last_latency_check'] == undefined) {
            calculate_latency(sessionID)
        }      
        else if ((Date.now())-sessions[sessionID]['last_latency_check']>=MAX_INTERVAL) {
            calculate_latency(sessionID)
        }
    
        
    }
    function pause(data,sid) {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            io.to(data['SESSID']).emit("pause",{"time":sessions[data['SESSID']]['latency']});
            sessions[data['SESSID']]['playing']=false;
            if (data['currentTime']!=undefined) {
                sessions[data['SESSID']]['serverTime']=data['new_time'];
            }
            check_interval(data['SESSID']);
        }
    }

    
    socket.on('latency_check', (data) => {

        if (data['SESSID'] in sessions && data['unique_id'] in users){
            let unique_id=data['unique_id'];
            let latency=(Date.now()-data['time'])/2;
            users[unique_id]['latency'].push(latency);
        }
        
    })
    socket.on('play', (data) => {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            io.to(data['SESSID']).emit("play",{"time":sessions[data['SESSID']]['latency']});
            sessions[data['SESSID']]['playing']=true;
            check_interval(data['SESSID']);
        }
        
    });
    socket.on('pause', (data) => {
        pause(data,socket.id);
    });
    socket.on('seek', (data) => {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            socket.broadcast.to(data['SESSID']).emit("seek",{"time":sessions[data['SESSID']]['latency'],"new_time":data['currentTime']});
            sessions[data['SESSID']]['playing']=false;
            if (data['currentTime']!=undefined) {
                sessions[data['SESSID']]['serverTime']=data['currentTime'];
            }
            check_interval(data['SESSID']);
        }
    });

    socket.on('timeUpdate', (data) => {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            sessions[data['SESSID']]['serverTime']=data['currentTime'];
            users[data['unique_id']]['currentTime']=data['currentTime'];
        }
        
    });
    socket.on('forceChangeUrl', (data) => {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            sessions[data['SESSID']]['serverTime']=data['currentTime'];
            users[data['unique_id']]['currentTime']=data['currentTime'];
            socket.broadcast.to(data['SESSID']).emit("forceChangeUrl",{"time":sessions[data['SESSID']]['latency'],"new_url":data['new_url']});
            sessions[data['SESSID']]['url']=data['new_url']
            sessions[data['SESSID']]['serverTime']=0
            pause(sid,data)
            check_interval(data['SESSID']);
        }
    });
    socket.on('seek', (data) => {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            socket.broadcast.to(data['SESSID']).emit("seek",{"time":sessions[data['SESSID']]['latency'],"new_time":data['currentTime']});
            sessions[data['SESSID']]['playing']=false;
            if (data['currentTime']!=undefined) {
                sessions[data['SESSID']]['serverTime']=data['currentTime'];
            }
            check_interval(data['SESSID']);
        }
    })
    socket.on('pause', (data) => {
        if (data['SESSID'] in sessions && data['unique_id'] in users) {
            io.to(data["SESSID"]).emit("pause",{"time":sessions[data['SESSID']]['latency']});
            sessions[data['SESSID']]['playing']=false;
            if (data['currentTime']!=undefined) {
                sessions[data['SESSID']]['serverTime']=data['currentTime'];
            }
            
            check_interval(data['SESSID']);
        }
    })


  });
  io.on('disconnect', (socket) => {
      let unique_id=""
      for (let i=0; i<users.length; i++) {
        if (users[i]['socketID']==sid) {
            unique_id=i;
            break;
        }
    }
    if (unique_id!="") {
        sessionID=users[unique_id]['sessionID'];
        socket.leave(sessionID);
        user_list=sessions[sessionID]['users'];
        user_list.splice(user_list.findIndex(unique_id));
        delete(users[unique_id]);
    }
        
    })
