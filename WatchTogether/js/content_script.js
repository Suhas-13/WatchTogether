chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        /*
        chrome.storage.local.set({token: 'd2f459ac9a4d5acd7f2b51d4ebe9fd75d79e8283ac46225f594a479ff7b'}, function() {
            console.log('Value is set to ');
          });
        */
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
               let socket=io("https://192.168.86.172/",{query:"id="+result['token']});    
               socket.on('play', function(data){video.play()});
               socket.on('pause', function(data){video.pause()});
    });
        
    });