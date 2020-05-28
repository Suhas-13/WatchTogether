let inSession=false;
let triggerChangeUrl=true;
let urlChanged=false;
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
    return true;
});
chrome.runtime.onMessage.addListener( 
    function(request,sender,sendResponse) {
        if (request.intent=="disableChangingUrl") {
            triggerChangeUrl=false;
        }
    }
)
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.url && changeInfo.url.includes("chrome://")==false) {
        inSession=true; 
        chrome.storage.local.get(["sess_token","sess_url","inSession"], function (result) {
            if (result['inSession']) {
                if (triggerChangeUrl) {
                    chrome.tabs.executeScript( tab.id, {code:"confirm('Would you like to continue the session?')"},function(response) {
                    
                        if (response) {
                            chrome.tabs.sendMessage(tabId, {value: result['sess_token'],intent:"changeUrl"}, function(response) {});
                        }
                        
                        else {              
                            chrome.storage.local.set({"sess_token":"","sess_url":"","inSession":false}, function() {});
                        }
                    })
                }
                else {
                    triggerChangeUrl=true;
                    urlChanged=true;
                }
            }
        })           
    
    }
    else if(changeInfo.status=="complete") {
        if (inSession) {
            inSession=false;
            if (urlChanged) {
                chrome.storage.local.get(["sess_token","sess_url","inSession"], function (result) {
                chrome.tabs.sendMessage(tabId, {value: result['sess_token'],intent:"join",sendPause:1}, function(response) {});
                })
                urlChanged=false;
            }
        }
        else {
            chrome.storage.local.get(["sess_token","sess_url","inSession"], function (result) {
                if (result["inSession"]) {                                    
                    chrome.tabs.sendMessage(tabId, {value: result['sess_token'],intent:"join",sendPause:1}, function(response) {});
                }
            })
        }
     }
        
    })
