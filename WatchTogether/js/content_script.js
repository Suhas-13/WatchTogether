let s;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
       let sess_token;
       
        if (s!=undefined) {
          s.stopSession();
        }
        if (request.intent!="destroy") {
          sess_token=request.value;
          chrome.storage.local.set({'sess_token': sess_token});
          chrome.storage.local.set({'sess_url': document.location.href});
          chrome.storage.local.set({'inSession': true});
        }
        

       chrome.storage.local.get('token', function (result) {

        if (request.intent=="create") {
                video=document.getElementsByTagName("video")[0];
                let formData = new FormData();
                formData.append('uniqueID', result['token']);
                formData.append("username","test");
                formData.append("url",document.location.href);
                formData.append("currentTime",(video.currentTime));
                formData.append("playing",(!video.paused));
                formData.append("sessionID",request["value"]);
                fetch('https://192.168.86.36/create_session', {
                    method: "post",
                    body: formData,
                    mode: 'no-cors'
                  }).then((res)=> {
                    s=new SocketObject(document.getElementsByTagName("video")[0],sess_token,result['token']);
                    s.startSession();
                  })
          }
        else if (request.intent=="join") {
                video=document.getElementsByTagName("video")[0];
                let formData = new FormData();
                formData.append('uniqueID', result['token']);
                formData.append("username","test");
                formData.append("sessionID",request["value"]);
                fetch('https://192.168.86.36/join_session', {
                    method: "post",
                    body: formData,
                    mode: 'no-cors'
                  }).then((res) => {
                    if (request.sendPause==true) {
                      s=new SocketObject(document.getElementsByTagName("video")[0],sess_token,result['token'],1);
                     }
                     else {
                      s=new SocketObject(document.getElementsByTagName("video")[0],sess_token,result['token']);
                     }
                     s.startSession();
                     s.sock.emit("pause",{SESSID:sess_token})
            })
        }
                
        
        else if (request.intent=="changeUrl") {
          chrome.storage.local.set({'sess_url': document.location.href});
          video=document.getElementsByTagName("video")[0];
          let formData = new FormData();
          formData.append('uniqueID', result['token']);
          formData.append("username","test");
          formData.append("sessionID",request["value"]);
          fetch('https://192.168.86.36/join_session', {
              method: "post",
              body: formData,
              mode: 'no-cors'
            }).then((res)=> {
              s=new SocketObject(video,sess_token,result['token'],2);
              s.startSession();
              s.forceChangeUrl(document.location.href);
            }) 
        }
      return true; 
    });
  });



    


   