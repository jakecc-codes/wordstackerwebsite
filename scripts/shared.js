const BSTXCONTAINERCOUNT = document.getElementById("blockstackcount");
let realStackSize = 0;
let stackSize = 0;

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
function computeFloorStackGapHeight(towerLoaderHeight, anim = false) {
    const FLOORSTACKGAP = document.getElementById("floorstackgap");
    const desiredGapSize = 162;
    if (FLOORSTACKGAP && towerLoaderHeight) {
        const gapSize = clamp(desiredGapSize - towerLoaderHeight, 0, desiredGapSize);
        if (gapSize === 0 || gapSize === desiredGapSize || !anim) {
            FLOORSTACKGAP.style.height = gapSize + "px";
        } else {
            FLOORSTACKGAP.animate([{height: gapSize + "px"}], {
                duration: 70,
                easing: "ease-out",
                fill: "forwards"
            }).play();
        }
    }
}

document.addEventListener('towerload', function(ev) {
    const towerLoader = ev.detail.loader;
    stackSize = towerLoader.childElementCount;
    document.getElementById(window.location.hash.split('#').at(-1))?.scrollIntoView({behavior: "smooth", block: "center"});

    if (BSTXCONTAINERCOUNT) {
        BSTXCONTAINERCOUNT.textContent = "Blocks Stacked: " + stackSize;
        BSTXCONTAINERCOUNT.style.visibility = "visible";
    }
    realStackSize = towerLoader.getBoundingClientRect().height;
    computeFloorStackGapHeight(realStackSize);
}, { passive: true });

window.addEventListener('DOMContentLoaded', (ev) => {
    const WOBBLELIMIT = 400;
    const WOBBLESPEED = 0.75;
    const FALLSPEED = 0.75; // TODO: Space is at 10,500 blocks, blocks fall slower and darkmode
    // TODO: When you click on the logo it changes colour (Easter Egg)

    const MODESWITCHER = document.getElementById("modeswitcher");
    const BSTXSENDER = document.getElementById("blockstacksender");
    const BSTXSENDERPROMPT = document.getElementById("blockstackinputprompt");
    const BSTXCONTAINER = document.getElementById("blockstack");
    let messageSent = false;
    let shiftHeld = false;
    let textSperator = false;
    let textPaste = false;
    let lastMessage;

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
            if (sel.type !== "Control") {
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
        const prevSolution = BSTXSENDERPROMPT?.textContent.split('|')[0].split(' ')[0];
        if (prevSolution !== "@ANONYMOUS" && textSolution.indexOf('@') === -1) {
            textSolution = prevSolution + " | " + textSolution + " ";
        } else {
            textSolution = textSolution.toUpperCase() + " | ";
        }
        if (textSolution.lastIndexOf('@', textSolution.indexOf('|')) === -1) {
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
            { marginLeft: (stackSize/WOBBLELIMIT) + 'px'},
            { marginLeft: -(stackSize/WOBBLELIMIT) + 'px'}
        ], {
            duration: WOBBLESPEED * 1000,
            direction: "alternate",
            iterations: "Infinity",
            easing: "ease-in-out"
        }).play();

        // Falling Animation
        const fallAnimDur = (FALLSPEED - intensity*0.5) * 1000;
        let fall = blockObj.animate([
            { marginTop: '-500px' },
            { marginTop: '0px' }
        ], {
            duration: fallAnimDur, // Add settings for this value
            easing: "linear", // In the robble use linear In space use ease-out
        });
        fall.play();

        fall.finished.then(() => {
            let sfx = new Audio("/audio/sfx_blockfall" + randAudioValue + ".mp3");
            sfx.volume = clamp(intensity + 0.2, 0.2, 1);
            sfx.play();
            blockObj.animate([
                {backgroundColor: 'lightyellow'}
            ], {
                duration: (intensity*5+1) * 600,
                direction: "reverse"
            }).play();
            if (BSTXCONTAINERCOUNT) {
                BSTXCONTAINERCOUNT.textContent = "Blocks Stacked: " + stackSize;
            }
        });
        setTimeout(function() {
            computeFloorStackGapHeight(realStackSize += blockObj.getBoundingClientRect().height, true);
        }, fallAnimDur*0.9);
    }

    function _BlockCreate(tag, text, requestDate) {
        const d1 = document.createElement('div');
        const a1 = document.createElement('a');
        const d2 = document.createElement('div');

        d1.classList.add('flex-width');
        d1.id = "block-" + stackSize;
        a1.href = "#" +  d1.id;
        a1.title = requestDate;
        d2.classList.add('block-item');
        d2.setAttribute('tag', tag);
        d2.setAttribute('text', text);
        d2.setAttribute('time', requestDate);
        if (lastMessage?.getAttribute('tag') === tag) {
            d2.innerHTML = text;
        } else {
            d2.innerHTML = `${text}<small><em class="tag-style">${tag}</em></small>`;
        }
        d2.addEventListener('click', () => copyLink(a1.href));

        BSTXCONTAINER.insertBefore(d1, BSTXCONTAINER.firstChild);
        d1.appendChild(a1);
        a1.appendChild(d2);

        //animations
        let power = text.length - (text.split(/\W/g).length-1)*3;
        _onBlockAnimate(d2, clamp(power * 0.01, 0, 1));
        lastMessage = d2;
    }

    //function onMessageSent(tag, text) {}

    /**
     * 
     * @param {string} textEnquiry 
     * @param {string} dateTooltip 
     * @returns {boolean}
     */
    function _onBlockStackBefore(textEnquiry, requestDate) {
        if (textEnquiry === "") {
            return false;
        }
        const atSymbIndex = textEnquiry.indexOf('@');
        const textEndIndex = textEnquiry.length; //TODO: Fix bug where random divs appear, randomly formatting text
        const textFormat = textEnquiry.lastIndexOf('|') === -1 ? [BSTXSENDERPROMPT.textContent.split('|')[0].split(' ')[0], textEnquiry.slice(0, textEndIndex)] : textEnquiry.slice(atSymbIndex, textEndIndex).split('|');
        let tag = (textFormat[0].split("&nbsp;")[0].split(" ")[0]).toUpperCase();
        let text = textFormat.at(-1).split("<div>").join('').split("</div>").join('');


        if (!BSTXCONTAINER || lastMessage?.getAttribute('text') === text || text.split("<br>").join('') === "") {
            return false;
        }
        if (document.dispatchEvent(new CustomEvent('blockcreate', {detail: { tag: tag, textHTML: text, rawHTMLString: textEnquiry, dateSent: requestDate, parent: BSTXCONTAINER }, cancelable: true}))) {
            _BlockCreate(tag, text, requestDate);
        }

        // random consts
        stackSize = BSTXCONTAINER.childElementCount;
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
        if (this.value !== 0) {
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
            case "Alt":
            case "Insert":
            case "Tab":
                if (document.activeElement === BSTXSENDER && (!BSTXSENDER?.textContent.includes('|') || !BSTXSENDER?.textContent.includes('@'))) {
                    ev.preventDefault();
                    BSTXSENDER.textContent = BSTXSENDERPROMPT?.textContent.slice(0, BSTXSENDERPROMPT?.textContent.indexOf("|")+1);
                    textPaste = true;
                    setTimeout(() => {moveCaret(window, BSTXSENDER.textContent.length);}, 30);// premove
                }
                break;
        }
        if (key !== lastKey) {
            lastKey = key;
            if (key.match(/[a-z]/i) || key === "Enter") {
                BSTXSENDER?.focus();
            }
            if (key === "Escape") {
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
            BSTXSENDERPROMPT.textContent = this.textContent.split('|')[0] + "| Type a Word/Phrase";
        }
        if (textSperator || textPaste) {
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
            if (this.innerHTML !== "") {
                const currentDate = new Date().toLocaleString();
                if (document.dispatchEvent(new CustomEvent('beforeblockcreate', {detail: { rawHTMLString: this.innerHTML, dateRequested: currentDate }, cancelable: true}))) {
                    _onBlockStackBefore(this.innerHTML, currentDate);
                    this.textContent = "";
                }
            }
        } else if (textSperator || textPaste) {
            textSperator = false;
            textPaste = false;
            moveCaret(window, BSTXSENDER.textContent.length);// postmove
        }
        if (BSTXSENDERPROMPT) {
            BSTXSENDERPROMPT.style.visibility = this.textContent !== "" ? "hidden" : "visible";
        }
    }


    MODESWITCHER?.addEventListener('change', onModeChange, {passive: true});
    BSTXSENDER?.addEventListener('input', onTextBoxInput, {passive: true});
    BSTXSENDER?.addEventListener('beforeinput', onTextBoxInputBefore);
    document.addEventListener('keydown', onTextBoxKeyDown);
    document.addEventListener('keyup', onTextBoxKeyUp, {passive: true});
    document.addEventListener('sudoblockcreate', (ev) => {
        _BlockCreate(ev.detail.tag, ev.detail.text, ev.detail.requestDate);
        stackSize = BSTXCONTAINER.childElementCount;
    }, {passive: true});
});