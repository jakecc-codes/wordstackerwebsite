const supabaseInstance = supabase.createClient('https://hdwkextgvjynwcfzyrdl.supabase.co', 'sb_publishable_FhQpe_upTFVHfUcmfDNRhA_jZQI1UO4');
const blockStackLoad = document.getElementById("blockstack");
const blockStackClear = document.getElementById("blockstackclear");
const bstxPrompt = document.getElementById("blockstackinputprompt");
const popupOpen = document.getElementById("popupopen");
const popupClose = document.getElementById("popupclose");
let leaderboardTag = localStorage.getItem("leaderboardTag") ?? "@ANONYMOUS";
let upsertTimeoutID = undefined;
let rankPos = undefined;
if (blockStackLoad) {
    blockStackLoad.innerHTML = localStorage.getItem("localBlockStack");
    document.dispatchEvent(new CustomEvent('towerload', { detail:{loader:blockStackLoad, tower:blockStackLoad.innerHTML} }));
}
if (bstxPrompt) {
    bstxPrompt.textContent = leaderboardTag + " | Type a Word/Phrase"; // TODO: make helper function... eventually...
} // TODO: Prevent multiplayer spam (make ghost blocks if they go before cooldown ends.)

/**
 * Converts 1, 2 and 3 to 1st, 2nd and 3rd.
 * @param {number} x
 * @returns {string} 
 */
function toOrdinal(x) {
    const ones = x % 10;
    const tens = Math.floor(x / 10) % 10;
    let str = x.toString();
    if (tens === 1) { return str + 'th'; }
    switch(ones) {
        case 1:
            str += 'st';
            break;
        case 2:
            str += 'nd';
            break;
        case 3:
            str += 'rd';
            break;
        default:
            str += 'th';
            break;
    }
    switch(ones) {
        case 1:
            str += " &#128081;";
            break;
        case 2:
            str += " &#129352;";
            break;
        case 3:
            str += " &#129353;";
            break;
    }
    return str;
}
/**
 * Converts 1, 2 and 3 to first, second and third.
 * @param {number} x
 * @returns {string} 
 */
function toOrdinalName(x) {
    const title = ["", "first", "second", "third"];
    return title[x] || "";
}

async function _LoadLeaderboard() {
    const leaderboard = document.getElementById("sololeaderboard");
    const userboard = document.getElementById("userboard");
    const entryCap = 29;
    const { data, error } = await supabaseInstance.from('blockstacks_solo_leaderboard').select().order('blockstackcount', {ascending: false}).limit(Math.max(entryCap, (rankPos ?? 999)));
    if (error) {
        console.error('Error loading leaderboard:', error);
    } else {
        if (leaderboard) {
            let entries = [`<col width="20%"/><col width="60%"/><col width="20%"/><tr><th>TAG</th><th>LASTQUOTE</th><th>STACK</th></tr>`];
            rankPos = undefined;
            for (let i=0; i<data.length; i++) {
                const entry = data[i];
                if (entry.tag === leaderboardTag) { rankPos = i; }
                if (i > entryCap) { if(rankPos) { break; } continue; }
                const rank = toOrdinalName(i+1);
                let rankTitle = ``;
                if (rank) {
                    rankTitle = ` class="${rank}place"`;
                }
                entries.push(`<tr${rankTitle}><td>${entry.tag}</td><td>"${entry.quote}"</td><td>${entry.blockstackcount}</td><td>`);
            }
            leaderboard.innerHTML = entries.join('');
        }
        if (userboard) {
            let userEntry = `<col width="20%"/><col width="60%"/><col width="20%"/><tr><td>${leaderboardTag}</td><td>...</td><td>...</td></tr>`;
            if (rankPos !== undefined) {
                const userData = data[rankPos];
                userEntry = `<col width="20%"/><col width="60%"/><col width="20%"/><tr><td colspan="3"><strong>You are placed ${toOrdinal(rankPos+1)}</strong></td></tr><tr><td>${leaderboardTag}</td><td>"${userData.quote}"</td><td>${userData.blockstackcount}</td></tr>`;
            }
            userboard.innerHTML = userEntry;
        }
    }
}
_LoadLeaderboard(); // should return true or false but ight

window.addEventListener('DOMContentLoaded', (ev) => {
    function onBlockStackClear(ev) {
        localStorage.removeItem("localBlockStack");
        localStorage.removeItem("leaderboardTag");
    }

    /**
     * 
     * @param {CustomEvent<{ tag: string; textHTML: string; rawHTMLString: string; dateSent: any; }>} ev 
     */
    async function onBlockCreate(ev) {
        const blockStack = ev.detail.parent;
        localStorage.setItem("localBlockStack", blockStack.innerHTML);
        const messageCount = blockStack.childElementCount;
        const newBlockCount = messageCount + 1;
        if (newBlockCount > 10500) {
            // Turn on dark mode
            console.log("darkmode!");
        }
        if (newBlockCount === 1) {
            leaderboardTag = ev.detail.tag;
            localStorage.setItem("leaderboardTag", leaderboardTag);
        }

        clearTimeout(upsertTimeoutID);
        upsertTimeoutID = setTimeout(async function() {
            const { error } = await supabaseInstance.rpc('upsert_bstx_leaderboard_solo', {bstxtag: leaderboardTag, bstxcount: newBlockCount, bstxquote: ev.detail.textHTML});
            if (error) {
                console.error('Error inserting:', error);
            } else {
                _LoadLeaderboard();
                console.log("Successfully: Updated solo leaderboard!");
            }
        }, 1080);
    }

    function onPopupOpen(ev) {
        popupClose.focus();
        popupClose.style.top = '0%';
        popupClose.style.opacity = '0';
        popupClose.animate([
            {opacity: 0},
            {opacity: 0.94}
        ], {
            duration: 200,
            easing: "ease-out",
            fill: 'forwards'
        }).play();
    }
    function onPopupClose(ev) {
        popupClose.style.opacity = '0.94';
        const animation = popupClose.animate([
            {opacity: 0.94},
            {opacity: 0}
        ], {
            duration: 200,
            easing: "ease-out",
            fill: 'forwards'
        });
        animation.play();
        animation.finished.then(() => {
            popupClose.style.top = '100%';
            popupOpen.focus();
        });
    }
    blockStackClear?.addEventListener('click', onBlockStackClear, {passive: true});
    popupOpen?.addEventListener('click', onPopupOpen, {passive: true});
    popupClose?.addEventListener('click', onPopupClose, {passive: true});
    document.addEventListener('blockcreate', onBlockCreate, {passive: true});
});

//localStorage.removeItem("localMessages");