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
