class SocketObject {
    constructor(video, sess_token, unique_token) {
       this.sock =io("https://192.168.86.172/",{query:"id="+unique_token});   
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
       this.play=video.paused
       this.pause=video.paused
    }

    startSession() {
    

      /*
      this.sock.on('play', function(data){
        console.log("before 1 second");
        setTimeout(function(data) {
          video.play();
          console.log("after 1 second");
        },data['time']-(new Date().getTime()/1000))
        
      });
      this.sock.on('play', function(data){
        console.log("before 1 second");
        setTimeout(function(data) {
          video.pause();
          console.log("after 1 second");
        },data['time']-(new Date().getTime()/1000))
        
      });
      */
     this.play=video.paused
     this.pause=video.paused
      $("video").bind("play",function(e, isScriptInvoked) {
        if (isScriptInvoked) {
          console.log("script");
          this.play=false;
        }
        else {
          if (this.play) {
            console.log("user");
            $('video').trigger("pause",[true]);
            //this.sock.emit("play",{SESSID:this.sess_token});
          }
          else {
            this.play=true;
          }
        }
      })
      $("video").bind("pause",function(e, isScriptInvoked) {
        if (isScriptInvoked) {
          console.log("script");
          this.pause=false;
        }
        else {
          if (this.pause) {
            console.log("user");
            $('video').trigger("play",[true]);
            //this.sock.emit("pause",{SESSID:this.sess_token});
          }
          else {
            this.pause=true;
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
