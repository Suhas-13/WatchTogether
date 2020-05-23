
<script src="jquery-3.4.1.min.js"></script>
let video = document.getElementsByTagName("video")[0];
function listener(play, currentTime) {
    console.log(play);
    console.log(currentTime);
}
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