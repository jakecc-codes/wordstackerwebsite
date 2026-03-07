window.addEventListener('DOMContentLoaded', (ev) => {
    const MODESWITCHER = document.getElementById("modeswitcher");
    const TEXTBOX = document.getElementById("messagesender");
    const TEXTBOXPROMPT = document.getElementById("messagesenderprompt");
    const BLOCKSTACK = document.getElementById("blockstack");
    var messageSent = false;
    var shiftHeld = false;
    var textSperator = false;
    var messageCount = 0;
    var lastMessage;

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

    function onMessageSent(tag, text) {}

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

        d1.classList.add('flex-width');
        d1.id = "block-" + messageCount;
        a1.href = "pages/profile.html";
        d2.classList.add('block-item');
        d2.setAttribute('tag', tag);
        d2.setAttribute('text', text);
        if (lastMessage?.getAttribute('tag') == tag) {
            d2.innerHTML = text;
        } else {
            d2.innerHTML = `<small><em>${tag}:</em></small><br>${text}`;
        }

        BLOCKSTACK.insertBefore(d1, BLOCKSTACK.firstChild);
        d1.appendChild(a1);
        a1.appendChild(d2);

        //animations
        d2.animate([
            { marginTop: '-1000px' },
            { marginTop: '0px' }
        ], {
            duration: 0.75 * 1000, // Add settings for this value
            iterations: 1
        }).play();

        d2.animate([ // Clamp this value lol
            { marginLeft: (messageCount/400) + 'px'},
            { marginLeft: -(messageCount/400) + 'px'},
            { marginLeft: (messageCount/400) + 'px'},
        ], {
            duration: 1 * 1000,
            iterations: Infinity
        }).play();

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
            onMessageSentBefore(this.innerHTML);
            if (this.textContent != "") {
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