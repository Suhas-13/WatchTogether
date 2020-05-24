class SocketObject {
    constructor(video, sess_token, unique_token) {
       this.sock =io("https://192.168.86.36/",{query:"id="+unique_token});   
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
    }

    startSession() {
    
      let that=this;
      
      this.sock.on('play', function(data){

        setTimeout(function(data) {
          jQuery('video').trigger("play",[true]);
        },data['time']-(new Date()/1000))
        
      });
      
      this.sock.on('pause', function(data){
        setTimeout(function(data) {
          jQuery('video').trigger("pause",[true]);
        },data['time']-(new Date()/1000))
        
      });
      
     let play=true;
     let pause=true;
     jQuery('video').bind("play",function(e, isScriptInvoked) {
        if (isScriptInvoked) {
          play=false;
        }
        else {
          if (play) {
            jQuery('video').trigger("pause",[true]);
            that.sock.emit("play",{SESSID:that.sess_token});
          }
          else {
            play=true;
          }
        }
      })

    jQuery('video').bind("pause",function(e, isScriptInvoked) {
        if (isScriptInvoked) {
          console.log("script pause");
          pause=false;
        }
        else {
          if (pause) {
            console.log("user pause");
            jQuery('video').trigger("play",[true]);
            that.sock.emit("pause",{SESSID:that.sess_token});
          }
          else {
            pause=true;
          }
        }
      })

    }
    stopSession() {
      
        this.sock.disconnect();
        chrome.storage.local.set({'sess_token': ""});
        chrome.storage.local.set({'sess_url': ""});
    }
  }
