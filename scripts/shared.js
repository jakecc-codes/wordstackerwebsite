window.addEventListener('DOMContentLoaded', (ev) => {
    const WOBBLELIMIT = 400;
    const WOBBLESPEED = 1;
    const FALLSPEED = 0.75;

    const MODESWITCHER = document.getElementById("modeswitcher");
    const TEXTBOX = document.getElementById("messagesender");
    const TEXTBOXPROMPT = document.getElementById("messagesenderprompt");
    const BLOCKSTACK = document.getElementById("blockstack");
    const BLOCKSTACKCOUNTER = document.getElementById("blockstackcounter");
    var messageSent = false;
    var shiftHeld = false;
    var textSperator = false;
    var messageCount = 0;
    var lastMessage;

    function clamp(v, m, M) {
        return v < m ? m : v > M ? M : v;
    }

    function moveCaret(win, charCount) {
        var sel, range;
        if (win.getSelection) {
            // IE9+ and other browsers
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                var textNode = sel.focusNode;
                var newOffset = sel.focusOffset + charCount;
                sel.collapse(textNode, Math.min(textNode.length, newOffset));
            }
        } else if ( (sel = win.document.selection) ) {
            // IE <= 8
            if (sel.type != "Control") {
                range = sel.createRange();
                range.move("character", charCount);
                range.select();
            }
        }
    }
    function formatText(textSolution) {
        textSolution = textSolution + " | ";
        if (textSolution[0] != '@') {
            textSolution = '@' + textSolution;
        }
        return textSolution;
    }
    function copyLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link Copied to Clipboard: " + url);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    }

    function onMessageAnimate(blockObj, intensity = 0) {
        const randAudioValue = Math.floor(Math.random() * 10) % 5 +1;
        // Wobble Animation
        blockObj.animate([ // Clamp this value lol
            { marginLeft: (messageCount/WOBBLELIMIT) + 'px'},
            { marginLeft: -(messageCount/WOBBLELIMIT) + 'px'},
            { marginLeft: (messageCount/WOBBLELIMIT) + 'px'},
        ], {
            duration: WOBBLESPEED * 1000,
            iterations: Infinity
        }).play();

        // Falling Animation
        var fall = blockObj.animate([
            { marginTop: '-500px' },
            { marginTop: '0px' }
        ], {
            duration: (FALLSPEED - intensity*0.5) * 1000, // Add settings for this value
            iterations: 1
        }); // TODO: Animate Dust Particles and Stack Size
        fall.play();
        fall.finished.then(() => {
            var sfx = new Audio("../audio/sfx_blockfall" + randAudioValue + ".mp3");
            sfx.volume = clamp(intensity + 0.2, 0.2, 1);
            sfx.play();
            blockObj.animate([
                {backgroundColor: 'lightyellow'},
                {backgroundColor: `${blockObj.style.backgroundColor}`}
            ], {
                duration: (intensity*10+1) * 600,
                iterations: 1
            }).play();
            if (BLOCKSTACKCOUNTER) {
                BLOCKSTACKCOUNTER.textContent = "Blocks Stacked: " + messageCount;
                BLOCKSTACKCOUNTER.style.visibility = "visible";
            }
        });
    }

    //function onMessageSent(tag, text) {}

    function onMessageSentBefore(textEnquiry) {
        if (textEnquiry == "") {
            return false;
        }
        const atSymbIndex = textEnquiry.lastIndexOf('@');
        const textStartIndex = textEnquiry.lastIndexOf('|');
        const textEndIndex = textEnquiry.lastIndexOf("<div>");
        var tag = textEnquiry.slice(atSymbIndex, textEnquiry.at(textStartIndex-1) == ' ' ? textStartIndex-1 : textStartIndex);
        if (tag == '') {tag = TEXTBOXPROMPT.textContent.slice(0, TEXTBOXPROMPT.textContent.lastIndexOf('|')-1);}
        var text = textEnquiry.slice(textEnquiry.at(textStartIndex+1) == ' ' ? textStartIndex+2 : textStartIndex+1, textEndIndex);

        if (!BLOCKSTACK || lastMessage?.getAttribute('text') == text) {
            return false;
        }
        const d1 = document.createElement('div');
        const a1 = document.createElement('a');
        const d2 = document.createElement('div');
        const date1 = new Date().toLocaleString();

        d1.classList.add('flex-width');
        d1.id = "block-" + messageCount;
        a1.href = "#" +  d1.id;
        a1.title = date1;
        d2.classList.add('block-item');
        d2.setAttribute('tag', tag);
        d2.setAttribute('text', text);
        d2.setAttribute('time', date1);
        if (lastMessage?.getAttribute('tag') == tag) {
            d2.innerHTML = text;
        } else {
            d2.innerHTML = `<small><em>${tag}:</em></small><br>${text}`;
        }
        d2.addEventListener('click', () => copyLink(a1.href));

        BLOCKSTACK.insertBefore(d1, BLOCKSTACK.firstChild);
        d1.appendChild(a1);
        a1.appendChild(d2);

        //animations
        onMessageAnimate(d2, clamp(text.length * 0.01, 0, 1));

        // random consts
        messageCount = BLOCKSTACK.childElementCount;
        TEXTBOXPROMPT.textContent = tag + " | Type a Word/Phrase";
        lastMessage = d2;

        onMessageSent(tag, text); // TODO: fix the profile.html file lol
        return true;
    }

    function onModeChange(ev) {
        if (this.value != 0) {
            this.form.submit();
        }
    }
    function onTextBoxKeyDown(ev) {
        switch(ev.key) {
            case "Enter":
                messageSent = !shiftHeld;
                break;
            case "Shift":
                shiftHeld = true;
                break;
            case " ":
                if (!this.textContent.includes('|') || !this.textContent.includes('@')) {
                    textSperator = true;
                }
                break;
        }
    }
    function onTextBoxKeyUp(ev) {
        switch(ev.key) {
            case "Shift":
                shiftHeld = false;
                break;
        }
    }
    function onTextBoxInputBefore(ev) {
        if (textSperator) {
            TEXTBOX.textContent = formatText(this.textContent);
            TEXTBOXPROMPT.textContent = this.textContent + "Type a Word/Phrase";
            moveCaret(window, TEXTBOX.textContent.length);// premove
        }
    }
    function onTextBoxInput(ev) {
        if (messageSent) {
            messageSent = false;
            if (this.innerHTML != "") {
                onMessageSentBefore(this.innerHTML);
                this.textContent = "";
            }
        } else if (textSperator) {
            textSperator = false;
            moveCaret(window, TEXTBOX.textContent.length);// postmove
        }
        if (TEXTBOXPROMPT) {
            TEXTBOXPROMPT.style.visibility = this.textContent != "" ? "hidden" : "visible";
        }
    }


    MODESWITCHER?.addEventListener('change', onModeChange);
    TEXTBOX?.addEventListener('keydown', onTextBoxKeyDown);
    TEXTBOX?.addEventListener('keyup', onTextBoxKeyUp);
    TEXTBOX?.addEventListener('input', onTextBoxInput);
    TEXTBOX?.addEventListener('beforeinput', onTextBoxInputBefore);
});