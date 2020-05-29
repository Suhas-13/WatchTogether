
function onDisconnect() {
    document.getElementById("disconnect").style.display="none";
    ocument.getElementById("saveForm").style.display="block";
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {intent:"destroy"}, function(response) {
        chrome.storage.local.set({'sess_token': ""});
        chrome.storage.local.set({'sess_url': ""});
        chrome.storage.local.set({'inSession': false});
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
                document.getElementById("saveForm").style.display="none";

    
            });
        });
        
    }

    else {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {value: val2,intent:"join"}, function(response) {
                document.getElementById("disconnect").style.display="block";
                document.getElementById("saveForm").style.display="none";
  
            });
        });
    }
}
document.getElementById("saveForm").addEventListener("click",onSubmit);
document.getElementById("disconnect").addEventListener("click",onDisconnect);
chrome.storage.local.get(["sess_token","sess_url","inSession"], function (result) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
        url=activeTab.url
        if (result["sess_token"] != "" && result["sess_url"] == url && result['inSession']) {
            document.getElementById("disconnect").style.display="block";
            document.getElementById("saveForm").style.display="none";
    
        }
        else {
            document.getElementById("disconnect").style.display="none";
            document.getElementById("saveForm").style.display="block";
        }
   
     });
});