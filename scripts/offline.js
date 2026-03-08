const blockStackLoad = document.getElementById("blockstack");
if (blockStackLoad) {
    blockStackLoad.innerHTML = localStorage.getItem("localBlockStack");
}

function onMessageSent(tag, text) {
    const element = document.getElementById("blockstack");
    if (element) {
        localStorage.setItem("localBlockStack", element.innerHTML);
    }
}

//localStorage.removeItem("localMessages");