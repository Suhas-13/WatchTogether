chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        /*
        chrome.storage.local.set({token: 'd2f459ac9a4d5acd7f2b51d4ebe9fd75d79e8283ac46225f594a479ff7b'}, function() {
            console.log('Value is set to ');
          });
        */
       let sess_token=request.value;
       chrome.storage.local.set({'sess': sess_token});
       chrome.storage.local.get('token', function (result) {
       
        if (request.create) {
                video=document.getElementsByTagName("video")[0];
                let formData = new FormData();
                formData.append('uniqueID', result['token']);
                formData.append("username","test");
                formData.append("url",document.location.href.split('?')[0]);
                formData.append("currentTime",(video.currentTime));
                formData.append("playing",(!video.paused));
                formData.append("sessionID",request["value"]);
                fetch('https://192.168.86.172/create_session', {
                    method: "post",
                    body: formData,
                    mode: 'no-cors'
                  }).then( (response) => { 
                    console.log(response)
                 });
                }
        else {
                video=document.getElementsByTagName("video")[0];
                let formData = new FormData();
                formData.append('uniqueID', result['token']);
                formData.append("username","test");
                formData.append("sessionID",request["value"]);
                fetch('https://192.168.86.172/join_session', {
                    method: "post",
                    body: formData,
                    mode: 'no-cors'
                  }).then( (response) => { 
                    console.log(response)
                 });
               }
               function listener(play, currentTime) {
                 if (play) {
                  socket.emit("play",{SESSID:sess_token})
                 }
                 else {
                   socket.emit("pause",{SESSID:sess_token})
                 }
                console.log(play);
                }
               let socket=io("https://192.168.86.172/",{query:"id="+result['token']});    
               socket.on('play', function(data){video.play();});
               socket.on('pause', function(data){video.pause();});

               video.addEventListener("play", function() {
                listener(true,video.currentTime)
                });
              video.addEventListener("pause", function() {
                    listener(false,video.currentTime)
                });
                  
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
              
    });
        
    });