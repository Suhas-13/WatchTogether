let s;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        /*
        chrome.storage.local.set({token: 'd2f459ac9a4d5acd7f2b51d4ebe9fd75d79e8283ac46225f594a479ff7b'}, function() {
            console.log('Value is set to ');
          });
        */
       let sess_token;
       if (request.intent!='destroy') {
          sess_token=request.value;
       }
       
       chrome.storage.local.set({'sess_token': sess_token});
       chrome.storage.local.set({'sess_url': document.location.href.split('?')[0]});
       chrome.storage.local.get('token', function (result) {

        if (request.intent=="create") {
          
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
                 s=new SocketObject(document.getElementsByTagName("video")[0],sess_token,result['token']);
                 s.startSession();
                }
        else if (request.intent=="join") {
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
                 s=new SocketObject(document.getElementsByTagName("video")[0],sess_token,result['token']);
                 s.startSession();
               }
        else if (request.intent=="destroy") {
          s.stopSession();
        }
              
                
               
        
        
               //startSession(video,sess_token,result['token']);
              
    });
    return true;
        
    });

   