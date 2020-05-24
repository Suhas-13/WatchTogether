class SocketObject {
    constructor(video, sess_token, unique_token) {
       this.sock =io("https://192.168.86.172/",{query:"id="+unique_token});   
       this.video=video;
       this.sess_token=sess_token;
       this.unique_token=unique_token;
    }

    startSession() {
    

    /* figure out why it's giving not ofund on videoo.addEventHandler */
      this.sock.on('play', function(data){video.play();});
      this.sock.on('pause', function(data){video.pause();});
      console.log(this.listener);
      this.listener_play = function(event) {
        this.sock.emit("play",{SESSID:this.sess_token});
      }
      this.listener_pause = function(event) {
        this.sock.emit("pause",{SESSID:this.sess_token});
      }
     this.video.addEventListener('play', this.listener_play.bind(this), false); // Trick
      this.video.addEventListener('pause', this.listener_pause.bind(this), false); // Trick

         
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
