window.addEventListener('DOMContentLoaded', (ev) => {
    const WOBBLELIMIT = 400;
    const WOBBLESPEED = 0.75;
    const FALLSPEED = 0.75; // TODO: Space is at 10,500 blocks, blocks fall slower and darkmode

    const MODESWITCHER = document.getElementById("modeswitcher");
    const BSTXSENDER = document.getElementById("blockstacksender");
    const BSTXSENDERPROMPT = document.getElementById("blockstackinputprompt");
    const BSTXCONTAINER = document.getElementById("blockstack");
    const BSTXCONTAINERCOUNT = document.getElementById("blockstackcount");
    let messageSent = false;
    let shiftHeld = false;
    let textSperator = false;
    let messageCount = 0;
    let lastMessage;

    /**
     * 
     * @param {number} v 
     * @param {number} m 
     * @param {number} M 
     * @returns {number}
     */
    function clamp(v, m, M) {
        return v < m ? m : v > M ? M : v;
    }

    /**
     * 
     * @param {Window} win 
     * @param {number} charCount 
     */
    function moveCaret(win, charCount) {
        let sel, range;
        if (win.getSelection) {
            // IE9+ and other browsers
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                let textNode = sel.focusNode;
                let newOffset = sel.focusOffset + charCount;
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
    /**
     * 
     * @param {string} textSolution 
     * @returns {string}
     */
    function formatText(textSolution) {
        textSolution = textSolution + " | ";
        if (textSolution[0] != '@') {
            textSolution = '@' + textSolution;
        }
        return textSolution;
    }
    /**
     * 
     * @param {string} url 
     */
    function copyLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link Copied to Clipboard: " + url);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    }

    /**
     * 
     * @param {HTMLDivElement} blockObj 
     * @param {number} intensity 
     */
    function _onBlockAnimate(blockObj, intensity = 0) {
        const randAudioValue = Math.floor(Math.random() * 10) % 5 +1;
        // Wobble Animation
        blockObj.animate([ // Clamp this value lol
            { marginLeft: (messageCount/WOBBLELIMIT) + 'px'},
            { marginLeft: -(messageCount/WOBBLELIMIT) + 'px'}
        ], {
            duration: WOBBLESPEED * 1000,
            direction: "alternate",
            iterations: "Infinity",
            easing: "ease-in-out"
        }).play();

        // Falling Animation
        let fall = blockObj.animate([
            { marginTop: '-500px' },
            { marginTop: '0px' }
        ], {
            duration: (FALLSPEED - intensity*0.5) * 1000, // Add settings for this value
            easing: "linear", // In the robble use linear In space use ease-out
        });
        fall.play();

        fall.finished.then(() => {
            let sfx = new Audio("/wordstackerwebsite/audio/sfx_blockfall" + randAudioValue + ".mp3");
            sfx.volume = clamp(intensity + 0.2, 0.2, 1);
            sfx.play();
            blockObj.animate([
                {backgroundColor: 'lightyellow'}
            ], {
                duration: (intensity*5+1) * 600,
                direction: "reverse"
            }).play();
            if (BSTXCONTAINERCOUNT) {
                BSTXCONTAINERCOUNT.textContent = "Blocks Stacked: " + messageCount;
                BSTXCONTAINERCOUNT.style.visibility = "visible";
            }
        });
    }

    //function onMessageSent(tag, text) {}

    /**
     * 
     * @param {string} textEnquiry 
     * @param {string} dateTooltip 
     * @returns {boolean}
     */
    function _onBlockStackBefore(textEnquiry, requestDate) {
        if (textEnquiry == "") {
            return false;
        }
        const atSymbIndex = textEnquiry.lastIndexOf('@');
        const textEndIndex = textEnquiry.lastIndexOf("<div>");
        const textFormat = textEnquiry.lastIndexOf('|') == -1 ? [BSTXSENDERPROMPT.textContent.split('|')[0].split(' ')[0], textEnquiry.slice(0, textEndIndex)] : textEnquiry.slice(atSymbIndex, textEndIndex).split('|');
        let tag = textFormat[0].split("&nbsp;")[0].split(" ")[0];
        let text = textFormat.at(-1);
        if(text.indexOf("<div>") == 0 && text.indexOf("</div>") == text.length-6) {
            text = text.slice(text.indexOf("<div>")+5, text.lastIndexOf("</div>"));
        } else if (text.indexOf("<div>") == -1 && text.indexOf("</div>") == text.length-6) {
            text = text.slice(0, text.lastIndexOf("</div>"));
        }


        if (!BSTXCONTAINER || lastMessage?.getAttribute('text') == text || text == "<br>" || text == "") {
            return false;
        }
        if (document.dispatchEvent(new CustomEvent('blockcreate', {detail: { tag: tag, textHTML: text, rawHTMLString: textEnquiry, dateSent: requestDate, parent: BSTXCONTAINER }, cancelable: true}))) {
            const d1 = document.createElement('div');
            const a1 = document.createElement('a');
            const d2 = document.createElement('div');

            d1.classList.add('flex-width');
            d1.id = "block-" + messageCount;
            a1.href = "#" +  d1.id;
            a1.title = requestDate;
            d2.classList.add('block-item');
            d2.setAttribute('tag', tag);
            d2.setAttribute('text', text);
            d2.setAttribute('time', requestDate);
            if (lastMessage?.getAttribute('tag') == tag) {
                d2.innerHTML = text;
            } else {
                d2.innerHTML = `<small><em>${tag}:</em></small><br>${text}`;
            }
            d2.addEventListener('click', () => copyLink(a1.href));

            BSTXCONTAINER.insertBefore(d1, BSTXCONTAINER.firstChild);
            d1.appendChild(a1);
            a1.appendChild(d2);

            //animations
            _onBlockAnimate(d2, clamp(text.length * 0.01, 0, 1));
            lastMessage = d2;
        }

        // random consts
        messageCount = BSTXCONTAINER.childElementCount;
        BSTXSENDERPROMPT.textContent = tag + " | Type a Word/Phrase";

        // TODO: fix the profile.html file lol
        return true;
    }

    /**
     * 
     * @param {HTMLElement} this 
     * @param {Event} ev 
     */
    function onModeChange(ev) {
        ev.stopPropagation();
        if (this.value != 0) {
            this.form.submit();
        }
    }

    let lastKey = "";
    /**
     * 
     * @param {HTMLElement} this 
     * @param {KeyboardEvent} ev 
     */
    function onTextBoxKeyDown(ev) {
        ev.stopPropagation();
        const key = ev.key;
        switch(key) {
            case "Enter":
                messageSent = !shiftHeld;
                break;
            case "Shift":
                shiftHeld = true;
                break;
            case " ":
                if (!BSTXSENDER?.textContent.includes('|') || !BSTXSENDER?.textContent.includes('@')) {
                    textSperator = true;
                }
                break;
        }
        if (key != lastKey) {
            lastKey = key;
            if (key.match(/[a-z]/i) || key == "Enter") {
                BSTXSENDER?.focus();
            }
            if (key == "Escape") {
                BSTXSENDER?.blur();
            }
        }
    }
    /**
     * 
     * @param {HTMLElement} this 
     * @param {KeyboardEvent} ev 
     */
    function onTextBoxKeyUp(ev) {
        ev.stopPropagation();
        switch(ev.key) {
            case "Shift":
                shiftHeld = false;
                break;
        }
    }
    /**
     * 
     * @param {HTMLElement} this 
     * @param {InputEvent} ev 
     */
    function onTextBoxInputBefore(ev) {
        ev.stopPropagation();
        if (textSperator) {
            BSTXSENDER.textContent = formatText(this.textContent);
            BSTXSENDERPROMPT.textContent = this.textContent + "Type a Word/Phrase";
            moveCaret(window, BSTXSENDER.textContent.length);// premove
        }
    }
    /**
     * 
     * @param {HTMLElement} this 
     * @param {Event} ev 
     */
    function onTextBoxInput(ev) {
        ev.stopPropagation();
        if (messageSent) {
            messageSent = false;
            if (this.innerHTML != "") {
                const currentDate = new Date().toLocaleString();
                if (document.dispatchEvent(new CustomEvent('beforeblockcreate', {detail: { rawHTMLString: this.innerHTML, dateRequested: currentDate }, cancelable: true}))) {
                    _onBlockStackBefore(this.innerHTML, currentDate);
                    this.textContent = "";
                }
            }
        } else if (textSperator) {
            textSperator = false;
            moveCaret(window, BSTXSENDER.textContent.length);// postmove
        }
        if (BSTXSENDERPROMPT) {
            BSTXSENDERPROMPT.style.visibility = this.textContent != "" ? "hidden" : "visible";
        }
    }


    MODESWITCHER?.addEventListener('change', onModeChange, {passive: true});
    BSTXSENDER?.addEventListener('input', onTextBoxInput, {passive: true});
    BSTXSENDER?.addEventListener('beforeinput', onTextBoxInputBefore, {passive: true});
    document.addEventListener('keydown', onTextBoxKeyDown, {passive: true});
    document.addEventListener('keyup', onTextBoxKeyUp, {passive: true});
});