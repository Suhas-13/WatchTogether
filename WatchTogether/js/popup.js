
function onDisconnect() {
    document.getElementById("disconnect").style.display="none";
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {intent:"destroy"}, function(response) {
    });
});

}
function onSubmit() {
    val1=document.getElementById("csession").value;
    val2=document.getElementById("jsession").value;

    if (val2=="") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {value: val1,intent:"create"}, function(response) {
                document.getElementById("disconnect").style.display="block";

    
            });
        });
        
    }

    else {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {value: val2,intent:"join"}, function(response) {
                document.getElementById("disconnect").style.display="block";
  
            });
        });
    }
}
document.getElementById("saveForm").addEventListener("click",onSubmit);
document.getElementById("disconnect").addEventListener("click",onDisconnect);
chrome.storage.local.get(["sess_token","sess_url"], function (result) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
   
        url=activeTab.url
        url=url.split("?")[0]
        if (result["sess_token"] != "" && result["sess_url"] == url) {
            document.getElementById("disconnect").style.display="block";
    
        }
        else {
            document.getElementById("disconnect").style.display="none";
    
        }
   
     });
   
    
});