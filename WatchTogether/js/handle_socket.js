class SocketObject {
    constructor(video, sess_token, unique_token,urlChange) {
      if (urlChange==2) {
        this.sock =io("https://192.168.86.36/",{query:"id="+unique_token,dontPlay:true});   
      }
      else {
        this.sock =io("https://192.168.86.36/",{query:"id="+unique_token,dontPlay:false});   
      }
       
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
       this.seekable=true;  
       if (urlChange==1) {
         this.urlChange=true;
       }
       else  {
         this.urlChange=false;
       }
       
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
        console.log(data['time']-(Date.now()/1000));
        setTimeout((data) => {
          jQuery('video').trigger("play",[true]);
          console.log("received play");
        },(data['time']-(new Date())/1000)*1000)
        
      });
      
      this.sock.on('pause', (data) => {
        console.log(data['time']-(Date.now()/1000));
        setTimeout(() => {
          jQuery('video').trigger("pause",[true]);
          console.log("received pause");
        },(data['time']-(new Date())/1000)*1000)
        
      });
      
      this.sock.on('seek', (data) => {
        console.log(data['time']-(Date.now()/1000));
        setTimeout(() => {
          seek_callback_false();
          this.video.currentTime=data['new_time'];
        },(data['time']-(Date.now()/1000)))
        setTimeout(() => {
          jQuery("video").trigger("pause",[true])
        },(data['time']-(new Date())/1000)*1000)
        
        
      });

      
      this.sock.on('forceChangeUrl', (data) => {
        chrome.runtime.sendMessage({intent: "disableChangingUrl"}, function(response) {
          setTimeout(() => {
            document.location.href=data['new_url'];
          },(data['time']-(new Date())/1000)*1000)
        });
      });

      this.sock.on('latency_check', (data) => {
        let latency_val=(Date.now()/1000)-data['time']
        console.log(latency_val);
        this.sock.emit("latency_check",{SESSID:this.sess_token,unique_id:this.unique_token,latency:latency_val});
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
        }
        else {
          if (!ignoreNextPlay) {
            jQuery('video').trigger("pause",[true]);
            if (this.urlChange) {
              this.urlChange=false
            }
            else {
              this.sock.emit("play",{SESSID:this.sess_token,unique_id:this.unique_token});
            }
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
        }
        else {
          if (!ignoreNextPause) {
            jQuery('video').trigger("play",[true]);
            this.sock.emit("pause",{SESSID:this.sess_token,unique_id:this.unique_token,currentTime:this.video.currentTime});
          }
          else {
            ignoreNextPause=false;
          }
        }
      })

      jQuery('video').bind("seeked",(event,isScriptInvoked) => {
        if (this.seekable) {
          jQuery('video').trigger("pause",[true]);
          
          this.sock.emit("seek",{SESSID:this.sess_token,currentTime:this.video.currentTime,unique_id:this.unique_token});

        }
        else {
          seek_callback_true();
          jQuery('video').trigger("pause",[true]);
        }
      })

    }
    stopSession() {
        this.sock.disconnect();
        jQuery("video").off();
    }
    forceChangeUrl(url) {
      this.sock.emit("forceChangeUrl",{"new_url":url,"SESSID":this.sess_token,unique_id:this.unique_token});
    }
  }
