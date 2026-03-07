window.addEventListener('DOMContentLoaded', (ev) => {
    const MODESWITCHER = document.getElementById("modeswitcher");
    const TEXTBOX = document.getElementById("messagesender");
    const TEXTBOXPROMPT = document.getElementById("messagesenderprompt");
    var messageSent = false;
    var shiftHeld = false;
    var textSperator = false;

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