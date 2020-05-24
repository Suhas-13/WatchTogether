
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
        chrome.storage.local.set({'sess_token': ""});
        chrome.storage.local.set({'sess_url': ""});
        let formData = new FormData();
        formData.append("token",token);
    }
});
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
  
        chrome.storage.local.get(["sess_token","sess_url"], function (result) {
            if (result["sess_token"] != "" && result["sess_url"] == document.location.href.split('?')[0]) {

                chrome.tabs.sendMessage(tabId, {value: val2,intent:"rejoin"}, function(response) {

                });


            }
        })}
  })
