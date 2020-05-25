class SocketObject {
    constructor(video, sess_token, unique_token) {
       this.sock =io("https://192.168.86.36/",{query:"id="+unique_token});   
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
       this.seekable=true;
    
    }

    startSession() {
    
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
          //this.setPlay(true);
        },(data['time']-(new Date()/1000))*1000)
        
      });
      
      this.sock.on('pause', (data) => {
        setTimeout(() => {
          jQuery('video').trigger("pause",[true]);
          //this.setPause(true);
        },(data['time']-(new Date()/1000))*1000)
        
      });
      
      this.sock.on('seek', (data) => {
        setTimeout(() => {
          seek_callback_false();
          this.video.currentTime=data['new_time'];
          jQuery("video").trigger("pause",[true])
        },(data['time']-(new Date()/1000))*1000)
        
      });
      
      let ignoreNextPlay=false;
      let ignoreNextPause=false;
     
     jQuery('video').bind("play",(e, isScriptInvoked) => {
        if (isScriptInvoked) {
          if (e.target.paused==true) {
            ignoreNextPlay=true;
          }
          else {
            ignoreNextPlay=false;
          }
          console.log("script play");
        }
        else {
          if (!ignoreNextPlay) {
            console.log("user play");

            jQuery('video').trigger("pause",[true]);
            this.sock.emit("play",{SESSID:this.sess_token});
          }
          else {
            ignoreNextPlay=false;
          }
        }
      })

      jQuery('video').bind("pause",(e, isScriptInvoked) => {
        if (isScriptInvoked) {
          if (e.target.paused==false) {
            ignoreNextPause=true;
          }
          else {
            ignoreNextPause=false;
          }
          console.log("script pause");
        }
        else {
          if (!ignoreNextPause) {
            console.log("user pause");

            jQuery('video').trigger("play",[true]);
            this.sock.emit("pause",{SESSID:this.sess_token});
          }
          else {
            ignoreNextPause=false;
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
          jQuery('video').trigger("pause",[true]);
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
