//this file will handle the creation and modification of events

function onSubmit() {
    val1=document.getElementById("csession").value;
    val2=document.getElementById("jsession").value;

    if (val2=="") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {value: val1,create:true}, function(response) {
            });
        });
        
    }

    else {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {value: val2,create:false}, function(response) {
            });
        });
    }
}
document.getElementById("saveForm").addEventListener("click",onSubmit);