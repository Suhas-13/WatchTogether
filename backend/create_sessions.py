from flask import Flask
from flask import Response
from flask import request
import socketio
from urllib.parse import unquote
import time
import threading
TOLERANCE=0.5

global lock
lock = threading.Lock()

sessions={}
users={}
sio = socketio.Server(logger=True,cors_allowed_origins='*',async_mode='threading')
app = Flask(__name__)
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

@sio.on("play")
def play(sid, data):
    sio.emit("play",{"time":time.time()+TOLERANCE},room=data['SESSID'])
    sessions[data['SESSID']]['playing']=True

    
@sio.on("pause")
def pause(sid, data):
 
    sio.emit("pause",{"time":time.time()+TOLERANCE},room=data['SESSID'])
    sessions[data['SESSID']]['playing']=False
    
@sio.on("seek")
def seek(sid, data):
    sio.emit("seek",{"time":time.time()+(TOLERANCE),"new_time":data['time']},room=data['SESSID'],skip_sid=sid)
    sessions[data['SESSID']]['playing']=False

@sio.on("forceChangeUrl")
def forceChangeUrl(sid, data):
    sio.emit("forceChangeUrl",{"time":time.time()+(TOLERANCE),"new_url":data['new_url']},room=data['SESSID'],skip_sid=sid)
    sessions[data['SESSID']]['url']=data['new_url']
    pause(sid,data)

@sio.on("connect")
def connect(sid, environ):
    query_string=unquote(environ["QUERY_STRING"])
    unique_id=(query_string.split("&")[0].split("id=")[1])
    
    if (unique_id!="undefined" and unique_id is not None):
        if unique_id not in users:
            users[unique_id]={"socketID":None,"sessionID":None,"currentTime":None}
        users[unique_id]['socketID']=sid
        sessionID=users[unique_id]['sessionID']
        with lock:
            sessions[sessionID]['users'].append(sid)
        sio.enter_room(sid,sessionID)
        playing=sessions[sessionID]['playing']
        sio.emit("pause",{"time":time.time()+TOLERANCE})
        users[unique_id]['currentTime']=sessions[sessionID]['serverTime']
        if (playing):
            sio.emit("seek",{"time":time.time()+TOLERANCE+0.2,"new_time":sessions[sessionID]['serverTime']},room=sid)
            sio.emit("play",{"time":time.time()+TOLERANCE+0.4},room=sid)
        else:
            sio.emit("seek",{"time":time.time()+TOLERANCE+0.2,"new_time":sessions[sessionID]['serverTime']},room=sid)
            sio.emit("pause",{"time":time.time()+TOLERANCE+0.4},room=sid)
 
            


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
            sessions[sessionID]={"users":[],"url":url,"playing":playing=="true","serverTime":currentTime}
            users[uniqueID]={"sessionID":sessionID,"socketID":None,"currentTime":None}
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