window.addEventListener('DOMContentLoaded', (ev) => {
    const blockStackLoad = document.getElementById("blockstack");
    const blockStackClear = document.getElementById("blockstackclear");
    if (blockStackLoad) {
        blockStackLoad.innerHTML = localStorage.getItem("localBlockStack");
    }
    
    function onClearBlockStack() {
        localStorage.removeItem("localBlockStack");
    }
    blockStackClear?.addEventListener('click', onClearBlockStack);
});

function onMessageSent(tag, text) {
    const element = document.getElementById("blockstack");
    if (element) {
        localStorage.setItem("localBlockStack", element.innerHTML);
        const messageCount = element.childElementCount;
        if (messageCount > 5000) {
            // Turn on dark mode
            console.log("darkmode!");
        }
    }
}

//localStorage.removeItem("localMessages");