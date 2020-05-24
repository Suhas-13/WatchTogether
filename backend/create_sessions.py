import sqlite3
from flask import Flask
from flask import Response
from flask import request
import socketio
from urllib.parse import unquote
import time
TOLERANCE=1
conn = sqlite3.connect('sessions.db')
cursor=conn.cursor()
user_table_check="SELECT name FROM sqlite_master WHERE type='table' AND name='user_list'"
session_table_check="SELECT name FROM sqlite_master WHERE type='table' AND name='session_list'"
user_table="""
CREATE TABLE user_list (
	unique_id TEXT PRIMARY KEY,
	sessionID TEXT,
    socketID TEXT,
    username TEXT
)
"""
session_table="""
CREATE TABLE session_list (
	sessionID TEXT PRIMARY_KEY,
	url TEXT,
    currentTime DECIMAL,
    playing INTEGER
)
"""

def wipe_db():
    conn=sqlite3.connect("sessions.db")
    cursor=conn.cursor()
    cursor.execute('delete from user_list')
    cursor.execute('delete from session_list')
    conn.commit()
    conn.close()
if len(cursor.execute(user_table_check).fetchall()) == 0:
    cursor.execute(user_table)
    conn.commit()
if len(cursor.execute(session_table_check).fetchall()) == 0:
    cursor.execute(session_table)
    conn.commit()

conn.close()
sio = socketio.Server(logger=True,cors_allowed_origins='*',async_mode='threading')
app = Flask(__name__)
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

@sio.on("play")
def play(sid, data):
    print("PLAYING" + " id is " + sid)
    conn=sqlite3.connect("sessions.db")
    cursor=conn.cursor()
    user_list=cursor.execute("select socketID from user_list where sessionID = ? and socketID is not NULL",(data["SESSID"],)).fetchall()
    print(user_list)
    for i in user_list:#and i[0] is not sid
        if (i[0] is not None):
            sio.emit("play",{"time":time.time()+TOLERANCE},room=i[0])
    

    conn.close()
    

@sio.on("pause")
def pause(sid, data):
    print("PAUSING" + " id is " + sid)
    conn=sqlite3.connect("sessions.db")
    cursor=conn.cursor()
    user_list=cursor.execute("select socketID from user_list where sessionID = ? and socketID is not NULL",(data["SESSID"],)).fetchall()
    for i in user_list:#and i[0] is not sid
        if (i[0] is not None):
            sio.emit("pause",{"time":time.time()+TOLERANCE},room=i[0])
            
    conn.close()

@sio.on("connect")
def connect(sid, environ):
    print('connect ', sid)
    conn = sqlite3.connect('sessions.db')
    cursor=conn.cursor()
    query_string=unquote(environ["QUERY_STRING"])
    unique_id=(query_string.split("&")[0].split("id=")[1])
    cursor.execute("update user_list set socketID = ? where unique_id = ?",(sid,unique_id))
    conn.commit()
    conn.close()
@sio.on("disconnect")
def disconnect(sid):
    conn = sqlite3.connect('sessions.db')
    cursor=conn.cursor()
    cursor.execute("update user_list set sessionID = NULL where sessionID = ? ",(sid,))
    print('disconnect ', sid)


@app.route("/create_session",methods=['POST'])
def create_session():
    conn = sqlite3.connect('sessions.db')
    cursor=conn.cursor()
    try:
        sessionID=request.form.get("sessionID")
        username=request.form.get("username")
        uniqueID=request.form.get("uniqueID")
        currentTime=request.form.get("currentTime")
        playing=request.form.get("playing")
        url=request.form.get("url")
        if len(sessionID) == 0 or len(url) == 0 or len(cursor.execute("select * from session_list where sessionID = ?",(sessionID,)).fetchall())>0:
            return Response("SessionID already in use", status=400)
        else:
            if len(cursor.execute("select * from user_list where unique_id = ?",(uniqueID,)).fetchall())==1:
                cursor.execute("insert into session_list (sessionID, url, currentTime, playing) VALUES (?,?,?,?)",(sessionID,url,currentTime,playing))
                cursor.execute("update user_list set sessionID = ?, username = ? where unique_id = ?",(sessionID,username,uniqueID))
            else:
                return Response("User has not been created", status=400)
            conn.commit()
            conn.close()
            
            return Response("Session created succesfully",status=200)
    except Exception as e:
        print(e)
        conn.close()
        return Response("Session not created yet",status=400)
@app.route("/join_session",methods=['POST'])
def join_session():
    conn = sqlite3.connect('sessions.db')
    cursor=conn.cursor()
    try:
        sessionID=request.form.get("sessionID")
        username=request.form.get("username")
        uniqueID=request.form.get("uniqueID")
        if len(sessionID) == 0  or len(cursor.execute("select * from session_list where sessionID = ?",(sessionID,)).fetchall())>0:
            if len(cursor.execute("select * from user_list where unique_id = ?",(uniqueID,)).fetchall())==1:
                cursor.execute("update user_list set sessionID = ?, username = ? where unique_id = ?",(sessionID,username,uniqueID))
                conn.commit()
                conn.close()
                return Response("Session joined succesfully", status=200)
    except Exception as e:
        print(e)
        conn.close()
        return Response("Session not created yet",status=400)
    return Response("Session not created yet",status=400)


@app.route("/create_user",methods=['POST'])
def create_user():
    conn = sqlite3.connect('sessions.db')
    cursor=conn.cursor()
    try:
        token=request.form.get("token")
        cursor.execute("insert into user_list (unique_id, sessionID, socketID, username) VALUES (?,?,?,?)",(token,None,None,None))
        conn.commit()
        conn.close()
    except Exception as e:
        conn.close()
        return Response("Session not created yet",status=400)
    return Response("User created succesfully",status=200)



    

if __name__ == "__main__":
    app.run(threaded=True,host="0.0.0.0",port=443,ssl_context=('cert.pem', 'key.pem'))