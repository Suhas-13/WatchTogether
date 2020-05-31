class SocketObject {
    constructor(video, sess_token, unique_token,urlChange) {
      if (urlChange==2) {
        this.sock =io(URL,{query:"id="+unique_token,dontPlay:true});   
      }
      else {
        this.sock =io(URL,{query:"id="+unique_token,dontPlay:false});   
      }
       
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
       this.latency=0;
       this.latency_values=[];
       this.seekable=true;  
       this.latency_count=0;
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
      }
      let seek_callback_false = ()=> {
        this.seekable=false;
      }
      this.sock.on('pong', (ms) => {
        this.latency_count--;
        if (this.latency_values.length>10) {
          this.latency_values.shift();
        }
        
        this.latency_values.push(ms);
        if (this.latency_count<0) {
          this.latency_count=5;
          this.latency = (this.latency_values.reduce((a, b) => a + b, 0))/this.latency_values.length;
          this.sock.emit("latency_update",{SESSID:this.sess_token,unique_id:this.unique_token,latency:this.latency});
        }
      });
      this.sock.on('play', (data) => {
        setTimeout(() => {
          jQuery('video').trigger("play",[true]);
        },data['time']-this.latency);
        
      });
      
      this.sock.on('pause', (data) => {
        setTimeout(() => {
          jQuery('video').trigger("pause",[true]);
          this.sock.emit("timeUpdate",{SESSID:this.sess_token,unique_id:this.unique_token,currentTime:this.video.currentTime});
        },data['time']-this.latency);
        
      });
      
      this.sock.on('seek', (data) => {
        setTimeout(() => {
          seek_callback_false();
          
        },data['time']-this.latency);
        jQuery("video").trigger("pause",[true])
        this.video.currentTime=data['new_time'];      
      });

      
      this.sock.on('forceChangeUrl', (data) => {
        chrome.runtime.sendMessage({intent: "disableChangingUrl"}, function(response) {
          setTimeout(() => {
            document.location.href=data['new_url'];
          },data['time']-this.latency);
        });
      });

      this.sock.on('latency_check', (data) => {
        this.sock.emit("latency_check",{SESSID:this.sess_token,unique_id:this.unique_token,time:data['time']});
      });
      this.sock.on('set_latency', (data) => {
        this.latency=data['latency'];
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
