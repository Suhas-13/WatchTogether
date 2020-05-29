from flask import Flask
from flask import Response
from flask import request
import socketio
import time
from urllib.parse import unquote
import time
import threading
DEFAULT_TOLERANCE=1
MAX_LATENCY=10
MAX_PINGS=10
MAX_INTERVAL=300

global lock
lock = threading.Lock()

sessions={}
users={}
sio = socketio.Server(logger=True,cors_allowed_origins='*',async_mode='threading')
app = Flask(__name__)
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)
def check_interval(unique_id,sid):
    if users[unique_id]['last_latency_check'] is None or time.time()-users[unique_id]['last_latency_check']>=MAX_INTERVAL:
        calculate_latency(unique_id,sid)
@sio.on("latency_check")
def latency_check(sid, data):
    unique_id=data['unique_id']
    users[unique_id]['latency'].append(min(MAX_LATENCY,data['latency']))
    pings=(users[unique_id]['latency'])
    ping_count=len(pings)
    if ping_count>=MAX_PINGS:
        current_latency=sum(pings)/len(pings)
        current_server_latency=sessions[data['SESSID']]['latency']
        sessions[data['SESSID']]['latency']=max(current_server_latency,current_latency)

def calculate_latency(unique_id,sid):
    users[unique_id]['latency']=[]
    users[unique_id]['last_latency_check']=time.time()
    for i in range(MAX_PINGS):
        sio.emit("latency_check",{"time":time.time()},room=sid)
    
@sio.on("play")
def play(sid, data):
    sio.emit("play",{"time":time.time()+sessions[data['SESSID']]['latency']},room=data['SESSID'])
    sessions[data['SESSID']]['playing']=True
    check_interval(data['unique_id'],sid)

    
@sio.on("pause")
def pause(sid, data):
    sio.emit("pause",{"time":time.time()+sessions[data['SESSID']]['latency']},room=data['SESSID'])
    sessions[data['SESSID']]['playing']=False
    sessions[data['SESSID']]['serverTime']=data['currentTime']
    check_interval(data['unique_id'],sid)
    
@sio.on("seek")
def seek(sid, data):
    sio.emit("seek",{"time":time.time()+(sessions[data['SESSID']]['latency']),"new_time":data['currentTime']},room=data['SESSID'],skip_sid=sid)
    sessions[data['SESSID']]['playing']=False
    sessions[data['SESSID']]['serverTime']=data['currentTime']
    check_interval(data['unique_id'],sid)

@sio.on("forceChangeUrl")
def forceChangeUrl(sid, data):
    sio.emit("forceChangeUrl",{"time":time.time()+(sessions[data['SESSID']]['latency']),"new_url":data['new_url']},room=data['SESSID'],skip_sid=sid)
    sessions[data['SESSID']]['url']=data['new_url']
    sessions[data['SESSID']]['serverTime']=0
    pause(sid,data)
    check_interval(data['unique_id'],sid)
@sio.on("timeUpdate")
def timeUpdate(sid,data):
    sessions[data['SESSID']]['serverTime']=data['currentTime']
    users[data['unique_id']]['currentTime']=data['currentTime']
@sio.on("connect")
def connect(sid, environ):
    query_string=unquote(environ["QUERY_STRING"])
    params=query_string[query_string.find("?id=")+4:len(query_string)]
    params=params.split("&")
    unique_id=params[0]
    shouldAutoPlay=params[1].split("=")[1]
    if (shouldAutoPlay)=="True":
        shouldAutoPlay=True
    else:
        shouldAutoPlay=False    
    if (unique_id!="undefined" and unique_id is not None):
        if unique_id not in users:
            users[unique_id]={"socketID":None,"sessionID":None,"currentTime":None}
        users[unique_id]['socketID']=sid
        sessionID=users[unique_id]['sessionID']
        with lock:
            sessions[sessionID]['users'].append(sid)
        sio.enter_room(sid,sessionID)
        sio.emit("pause",{"time":time.time()+DEFAULT_TOLERANCE})
        time.sleep(DEFAULT_TOLERANCE*2)
        users[unique_id]['currentTime']=sessions[sessionID]['serverTime']
        if (sessions[sessionID]['playing']):
            sio.emit("seek",{"time":time.time()+DEFAULT_TOLERANCE,"new_time":sessions[sessionID]['serverTime']},room=sid)
            if (shouldAutoPlay):
                sio.emit("play",{"time":time.time()+DEFAULT_TOLERANCE+0.4},room=sid)
        else:
            sio.emit("seek",{"time":time.time()+DEFAULT_TOLERANCE,"new_time":sessions[sessionID]['serverTime']},room=sid)
            sio.emit("pause",{"time":time.time()+DEFAULT_TOLERANCE+0.4},room=sid)
    calculate_latency(unique_id,sid)

@sio.on("disconnect")
def disconnect(sid):
    unique_id=""
    with lock:
        for i in users:
            if users[i]['socketID']==sid:
                unique_id=i
                break
    if unique_id!="":
        sessionID=users[unique_id]['sessionID']
        sio.leave_room(sid,sessionID)
        user_list=sessions[sessionID]['users']
        user_list.pop(user_list.index(sid))
        del(users[unique_id])
    
@app.route("/create_session",methods=['POST'])
def create_session():
    try:
        sessionID=request.form.get("sessionID")
        uniqueID=request.form.get("uniqueID")
        playing=request.form.get("playing")
        url=request.form.get("url")
        currentTime=request.form.get("currentTime")
        if len(sessionID) == 0 or len(url) == 0 or sessionID in sessions:
            return Response("SessionID already in use", status=400)
        else:
            sessions[sessionID]={"users":[],"url":url,"playing":playing=="true","serverTime":currentTime,"latency":DEFAULT_TOLERANCE}
            users[uniqueID]={"sessionID":sessionID,"socketID":None,"currentTime":None,"latency":[],"last_latency_check":None}
            return Response("Session created succesfully",status=200)
    except Exception as e:
        print(e)
        return Response("Session not created yet",status=400)
@app.route("/join_session",methods=['POST'])
def join_session():
    try:
        sessionID=request.form.get("sessionID")
        username=request.form.get("username")
        uniqueID=request.form.get("uniqueID")
        if len(sessionID) == 0  or sessionID not in sessions:
            return Response("Failed to join session", status=400)
        else:
            users[uniqueID]={"sessionID":sessionID,"socketID":None,"currentTime":None}
            return Response("Session joined succesfully", status=200)
    except Exception as e:
        print(e)
        return Response("Session not created yet",status=400)
    return Response("Session not created yet",status=400)



if __name__ == "__main__":
    app.run(threaded=True,host="0.0.0.0",port=443,ssl_context=('cert.pem', 'key.pem'))