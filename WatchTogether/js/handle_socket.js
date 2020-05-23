class SocketObject {
    constructor(video, sess_token, unique_token) {
       this.sock =io("https://192.168.86.172/",{query:"id="+unique_token});   
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
    }
    listener(play, currentTime) {
       console.log(this.sock);

      if (play) {
      this.sock.emit("play",{SESSID:this.sess_token})
      }
      else {
      this.sock.emit("pause",{SESSID:this.sess_token})
      }

  }
    startSession() {
    

    /* figure out why it's giving not ofund on videoo.addEventHandler */
      this.sock.on('play', function(data){video.play();});
      this.sock.on('pause', function(data){video.pause();});
      console.log(this.listener);
      video.addEventListener("play", this.listener(true,video.currentTime));
      video.addEventListener("pause", this.listener(false,video.currentTime));
         
     function react(mutationList, observer) {
         [...mutationList].forEach(mr => {
           mr.addedNodes.forEach(node => {
             if (node.nodeType === 1 && node.tagName.toLowerCase() === 'video') {
               events.forEach(ev => node.addEventListener(ev, listener)) 
             }
           })
         })
       }
     let observer = new MutationObserver(react);
     let config = { childList: true, subtree: true };
     observer.observe(video, config);
    
    }
    stopSession() {
        this.sock.disconnect();
        chrome.storage.local.set({'sess_token': ""});
        chrome.storage.local.set({'sess_url': ""});
    }
  }
