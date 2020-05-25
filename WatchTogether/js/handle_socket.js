class SocketObject {
    constructor(video, sess_token, unique_token) {
       this.sock =io("https://192.168.86.36/",{query:"id="+unique_token});   
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
       this.seekable=true;
    }

    startSession() {
    
      let that=this;
      let seek_callback_true = ()=> {
        this.seekable=true;
        console.log("setting seek on")
      }
      let seek_callback_false = ()=> {
        this.seekable=false;
        console.log("setting seek off")
      }
      this.sock.on('play', (data) => {
        setTimeout((data) => {
          jQuery('video').trigger("play",[true]);
        },(data['time']-(new Date()/1000))*1000)
        
      });
      
      this.sock.on('pause', (data) => {
        setTimeout(() => {
          jQuery('video').trigger("pause",[true]);
        },(data['time']-(new Date()/1000))*1000)
        
      });
      
      this.sock.on('seek', (data) => {
        setTimeout(() => {
          seek_callback_false();
          this.video.currentTime=data['new_time'];
          jQuery("video").trigger("pause",[true])
        },(data['time']-(new Date()/1000))*1000)
        
      });
      
      
      
     let play=video.paused;
     let pause=video.paused;
     
     jQuery('video').bind("play",(e, isScriptInvoked) => {
        if (isScriptInvoked) {
          play=false;
        }
        else {
          if (play) {
            jQuery('video').trigger("pause",[true]);
            this.sock.emit("play",{SESSID:this.sess_token});
          }
          else {
            play=true;
          }
        }
      })

    jQuery('video').bind("pause",(e, isScriptInvoked) => {
        if (isScriptInvoked) {
          console.log("script pause");
          pause=false;
        }
        else {
          if (pause) {
            console.log("user pause");
            jQuery('video').trigger("play",[true]);
            this.sock.emit("pause",{SESSID:this.sess_token});
          }
          else {
            pause=true;
          }
        }
      })

      jQuery('video').bind("seeked",(event,isScriptInvoked) => {
        if (this.seekable) {
          jQuery('video').trigger("pause",[true]);
          this.sock.emit("seek",{SESSID:this.sess_token,time:this.video.currentTime});

        }
        else {
          seek_callback_true();
        }
      })

    }
    stopSession() {
      
        this.sock.disconnect();
        chrome.storage.local.set({'sess_token': ""});
        chrome.storage.local.set({'sess_url': ""});
        jQuery("video").off();
    }
  }
