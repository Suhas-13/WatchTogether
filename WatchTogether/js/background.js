
function getRandomToken() {
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    return hex;
}

chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        token = getRandomToken();
        chrome.storage.local.set({'token': token});
        let formData = new FormData();
        formData.append("token",token);
        fetch('https://192.168.86.172/create_user', {
            method: "post",
            body: formData,
            mode: 'no-cors'
          }).then( (response) => { 
            console.log(response)
         })
    }
});