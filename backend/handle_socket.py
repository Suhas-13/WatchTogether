import sqlite3
from flask import Flask
from flask import Response
from flask import request
import socketio
from urllib.parse import unquote


sio = socketio.Server(logger=True,cors_allowed_origins='*',async_mode='threading')
app = Flask(__name__)
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

@sio.on("play")
def play(sid, data):
    conn=sqlite3.connect("sessions.db")
    cursor=conn.cursor()
    user_list=cursor.execute("select socketID from user_list where sessionID = ?",(data["SESSID"],)).fetchall()
    for i in user_list:
        if (i[0] is not None):
            sio.emit("play",{},room=i[0])
    

@sio.on("pause")
def pause(sid, data):
    conn=sqlite3.connect("sessions.db")
    cursor=conn.cursor()
    user_list=cursor.execute("select socketID from user_list where sessionID = ?",(data["SESSID"],)).fetchall()
    for i in user_list:
        if (i[0] is not None):
            sio.emit("pause",{},room=i[0])

@sio.on("connect")
def connect(sid, environ):
    print('connect ', sid)
    query_string=unquote(environ["QUERY_STRING"])
    unique_id=(query_string.split("&")[0].split("id=")[1])
    cursor.execute("update user_list set socketID = ? where unique_id = ?",(sid,unique_id))

@sio.on("disconnect")
def disconnect(sid):
    print('disconnect ', sid)

if __name__ == "__main__":
    app.run(threaded=True,debug=False)