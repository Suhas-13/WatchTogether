const https = require('https');
const fs = require('fs');
var express = require('express');
var app = express();

let sessions={};
let users={};
const DEFAULT_LATENCY=700
const MAX_LATENCY=10
const MAX_PINGS=10
const MAX_INTERVAL=30000
var bodyParser = require('body-parser');
app.use(express.json());
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
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
        sessions[sessionID]={"users":[],"url":url,"playing":playing,"serverTime":currentTime,"latency":DEFAULT_LATENCY}
        users[uniqueID]={"sessionID":sessionID,"socketID":undefined,"currentTime":undefined,"latency":[],"last_latency_check":undefined}
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
        users[uniqueID]={"sessionID":sessionID,"socketID":undefined,"currentTime":undefined,"latency":[],"last_latency_check":undefined}
        res.sendStatus(200);
    }
  });

  
const server=https.createServer(options,app).listen(443);
const io = require('socket.io')(server, {
    path: '/socket.io',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });
  io.on('connection', (socket) => {
    let unique_id=socket.handshake.query.id;
    let sid=socket.id;
    let autoPlay=socket.handshake.query.dontPlay;

    
    if (unique_id!=undefined && sid != undefined && unique_id in users) {
        if (!(unique_id in users)) {
            users[unique_id]={"socketID":undefined,"sessionID":undefined,"currentTime":undefined}
        }
        users[unique_id]['socketID']=sid
        sessionID=users[unique_id]['sessionID']
        sessions[sessionID]['users'].push(socket.id)
        socket.join(sessionID);
        io.to(sessionID).emit("pause",{"time":(Date.now())+sessions[sessionID]['latency']});
        setTimeout(()=>{
            users[unique_id]['currentTime']=sessions[sessionID]['serverTime'];
            socket.emit("seek",{"time":(Date.now())+DEFAULT_LATENCY,"new_time":sessions[sessionID]['serverTime']})
            if (sessions[sessionID]['playing']) {
                if (autoPlay) {
                    socket.emit("play",{"time":(Date.now())+DEFAULT_LATENCY+400})
                }
                else {
                    socket.emit("pause",{"time":(Date.now())+DEFAULT_LATENCY+400});
                }
            }
        },DEFAULT_LATENCY*1000);
        calculate_latency(unique_id,sid);
    }
    function calculate_latency(unique_id,sid) {
        users[unique_id]['latency']=[]
        users[unique_id]['last_latency_check']=(Date.now());
        for (let i=0; i<MAX_PINGS; i++) {
            let time=(Date.now());
            console.log(time);
            socket.emit("latency_check",{"time":(time)});
        }  
    }
    function check_interval(unique_id,sid) {
        if (unique_id!=undefined && unique_id in users) {
            if (users[unique_id]['last_latency_check'] == undefined) {
                calculate_latency(unique_id,sid)
            }      
            else if ((Date.now())-users[unique_id]['last_latency_check']>=MAX_INTERVAL) {
                calculate_latency(unique_id,sid)
            }
        }
        
    }
    function pause(data,sid) {
        io.to(data['SESSID']).emit("pause",{"time":(Date.now())+sessions[data['SESSID']]['latency']});
        sessions[data['SESSID']]['playing']=false;
        if (data['currentTime']!=undefined) {
            sessions[data['SESSID']]['serverTime']=data['new_time'];
        }
        check_interval(data['unique_id'],sid)
    }

    socket.on('latency_check', (data) => {
        let unique_id=data['unique_id'];
        users[unique_id]['latency'].push(Math.min(MAX_LATENCY,data['latency']))
        let pings=(users[unique_id]['latency'])
        let ping_count=pings.length;
        if (ping_count>=MAX_PINGS) {
            const sum = pings.reduce((a, b) => a + b, 0);
            const current_latency = (sum / ping_count) || 0;
            
            let current_server_latency=sessions[data['SESSID']]['latency']
            sessions[data['SESSID']]['latency']=Math.max(current_server_latency,current_latency)
        }
    })
    socket.on('play', (data) => {
        io.to(data['SESSID']).emit("play",{"time":(Date.now())+sessions[data['SESSID']]['latency']});
        sessions[data['SESSID']]['playing']=true;
        check_interval(data['unique_id'],socket.id)
    });
    socket.on('pause', (data) => {
        pause(data,socket.id);
    });
    socket.on('seek', (data) => {
        socket.broadcast.to(data['SESSID']).emit("seek",{"time":(Date.now())+(sessions[data['SESSID']]['latency']),"new_time":data['currentTime']});
        sessions[data['SESSID']]['playing']=false;
        if (data['currentTime']!=undefined) {
            sessions[data['SESSID']]['serverTime']=data['currentTime'];
        }
        check_interval(data['unique_id'],socket.id);
    });

    socket.on('timeUpdate', (data) => {
        if (data['unique_id'] in users) {
            sessions[data['SESSID']]['serverTime']=data['currentTime'];
            users[data['unique_id']]['currentTime']=data['currentTime'];
        }
        
    });
    socket.on('forceChangeUrl', (data) => {
        sessions[data['SESSID']]['serverTime']=data['currentTime'];
        users[data['unique_id']]['currentTime']=data['currentTime'];
        socket.broadcast.to(data['SESSID']).emit("forceChangeUrl",{"time":(Date.now())+(sessions[data['SESSID']]['latency']),"new_url":data['new_url']});
        sessions[data['SESSID']]['url']=data['new_url']
        sessions[data['SESSID']]['serverTime']=0
        pause(sid,data)
        check_interval(data['unique_id'],socket.id)
    });
    socket.on('seek', (data) => {
        socket.broadcast.to(data['SESSID']).emit("seek",{"time":(Date.now())+(sessions[data['SESSID']]['latency']),"new_time":data['currentTime']});
        sessions[data['SESSID']]['playing']=false;
        if (data['currentTime']!=undefined) {
            sessions[data['SESSID']]['serverTime']=data['currentTime'];
        }
        check_interval(data['unique_id'],socket.id);
    })
    socket.on('pause', (data) => {
        io.to(data["SESSID"]).emit("pause",{"time":(Date.now())+sessions[data['SESSID']]['latency']});
        sessions[data['SESSID']]['playing']=false;
        if (data['currentTime']!=undefined) {
            sessions[data['SESSID']]['serverTime']=data['currentTime'];
        }
        
        check_interval(data['unique_id'],socket.id);
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
        user_list.splice(user_list.findIndex(sid));
        delete(users[unique_id]);
    }
        
    })
            