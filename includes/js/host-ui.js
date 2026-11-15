/* ==========================================================================
   PS4 Host · Loopayeh — minimal UI controller
   Drives the exploit engine (firmware.js / HENs.js / jailbreak.js / chains).
   ========================================================================== */
(function () {
    'use strict';

    var el = function (id) { return document.getElementById(id); };
    var HEN = 'GoldHEN';

    function fw() {
        var v = (typeof getPs4FwVersion === 'function') ? getPs4FwVersion() : null;
        return v ? String(v) : null;
    }

    /* ---------------------------------------------------------------- chains */
    function availableChains() {
        var f = fw();
        if (!f) return FIRMWARE_RANGES.map(function (r) { return r.id; });
        return getAvailableChains(parseFloat(f));
    }

    function currentChain() {
        var v = null;
        if (typeof user !== 'undefined' && user.exploitChain !== null && user.exploitChain !== undefined) v = user.exploitChain;
        if (v === null) { try { v = storage.getNumber('exploitChain', null); } catch (e) { v = null; } }
        var f = fw();
        if (v === null || isNaN(v)) v = f ? getDefaultChain(parseFloat(f)) : null;
        if (v === null) {
            var av = availableChains();
            v = av.length ? av[0] : FIRMWARE_RANGES[0].id;
        }
        return v;
    }

    function exploitChain(value) {
        var id = parseFloat(value);
        if (typeof user !== 'undefined') user.exploitChain = id;
        try { storage.set('exploitChain', String(id)); } catch (e) {}
    }

    function loadExploitChain() { paintChains(currentChain()); }

    function chainLabel(id) {
        for (var i = 0; i < FIRMWARE_RANGES.length; i++) {
            if (FIRMWARE_RANGES[i].id === Number(id)) return FIRMWARE_RANGES[i].label;
        }
        return '\u2014';
    }

    function rangeLabel(r) {
        return r.min === r.max ? String(r.min) : (r.min + ' \u2013 ' + r.max);
    }

    function paintModel() {
        var n = el('modelName');
        if (n) n.textContent = chainLabel(currentChain());
    }

    function paintChains(id) {
        var items = document.querySelectorAll('#chainGrid .chip');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('on', Number(items[i].getAttribute('data-id')) === Number(id));
        }
        paintModel();
    }

    function buildChains() {
        var box = el('chainGrid');
        if (!box) return;
        var avail = availableChains();
        var seen = {};
        box.innerHTML = '';
        FIRMWARE_RANGES.forEach(function (r) {
            if (seen[r.id] || avail.indexOf(r.id) === -1) return;
            seen[r.id] = 1;
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip';
            b.setAttribute('data-id', r.id);
            b.innerHTML = '<span></span><small></small>';
            b.firstChild.textContent = r.label;
            b.lastChild.textContent = rangeLabel(r);
            b.onclick = function () {
                exploitChain(r.id);
                paintChains(r.id);
            };
            box.appendChild(b);
        });
        if (!avail.length) {
            box.innerHTML = '<div class="hint">No exploit chain is defined for this firmware.</div>';
        }
        paintChains(currentChain());
    }

    /* -------------------------------------------------------------- firmware */
    function paintFw() {
        var pill = el('fwPill');
        var hint = el('startHint');
        var f = fw();
        if (!pill) return;
        if (!f) {
            pill.textContent = 'Open on PS4';
            pill.className = 'fw bad';
            if (hint) hint.textContent = 'This host runs inside the console browser.';
            return;
        }
        var ok = isFirmwareSupported(parseFloat(f));
        pill.textContent = 'Firmware ' + f;
        pill.className = 'fw' + (ok ? '' : ' bad');
        if (hint) {
            hint.textContent = ok
                ? 'Best chain for this firmware is selected automatically.'
                : 'This firmware is not supported.';
        }
    }

    function paintHen() {
        var v = '2.4b18.14';
        try { v = (storage.getString('GHVer', 'GHv2.4b18.14') || 'GHv2.4b18.14').replace('GHv', ''); } catch (e) {}
        var n = el('ghVer');
        if (n) n.textContent = v;
    }

    /* ---------------------------------------------------------------- payload */
    var PAY_TABS = [
        ['tools', 'Tools'],
        ['homebrew', 'Homebrew'],
        ['linux', 'Linux'],
        ['advanced', 'Advanced']
    ];
    var currentTab = 'tools';
    var payRendered = false;

    function renderPayloads(tab) {
        currentTab = tab || currentTab;
        var tabs = el('payTabs');
        if (tabs && !tabs.dataset.built) {
            tabs.dataset.built = '1';
            tabs.innerHTML = '';
            PAY_TABS.forEach(function (t) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'chip';
                b.textContent = t[1];
                b.setAttribute('data-tab', t[0]);
                b.onclick = function () { renderPayloads(t[0]); };
                tabs.appendChild(b);
            });
        }
        if (tabs) {
            var bs = tabs.querySelectorAll('.chip');
            for (var i = 0; i < bs.length; i++) {
                bs[i].classList.toggle('on', bs[i].getAttribute('data-tab') === currentTab);
            }
        }

        var grid = el('payGrid');
        if (!grid || typeof payloadsList === 'undefined') return;
        grid.innerHTML = '';
        payloadsList.forEach(function (p) {
            if (p.category !== currentTab) return;
            var card = document.createElement('button');
            card.type = 'button';
            card.className = 'pay';

            var title = document.createElement('b'); title.textContent = p.name; card.appendChild(title);
            var author = document.createElement('i'); author.innerHTML = p.author || ''; card.appendChild(author);
            var desc = document.createElement('p'); desc.innerHTML = p.description || ''; card.appendChild(desc);
            if (p.specificFW) {
                var fwTag = document.createElement('span'); fwTag.textContent = p.specificFW; card.appendChild(fwTag);
            }
            card.onclick = function () { sendPayload(p); };
            grid.appendChild(card);
        });
        payRendered = true;
    }

    function sendPayload(p) {
        if (!isPS4Console()) {
            alert('Payloads can only be sent from the console.');
            return;
        }
        if (p.id === 'FanThreshold') { askFan(); return; }
        try { Loadpayloads(p); } catch (e) { alert('Could not send: ' + e.message); }
    }

    function askFan() {
        var t = prompt('Fan threshold temperature: 60 / 70 / 80 / 85', '70');
        if (!t) return;
        t = String(t).trim();
        if (['60', '70', '80', '85'].indexOf(t) === -1) return;
        loadFanThreshold(t);
    }

    /* --------------------------------------------------------------- sheets */
    function closeSheets() {
        ['sheet', 'paySheet', 'scrim'].forEach(function (id) {
            var e = el(id);
            if (e) e.classList.add('hidden');
        });
    }

    function openSheet(id) {
        closeSheets();
        var s = el(id), b = el('scrim');
        if (s) s.classList.remove('hidden');
        if (b) b.classList.remove('hidden');
    }

    /* ------------------------------------------------------------------- run */
    function setBadge(kind, text, animate) {
        var b = el('runBadge');
        if (!b) return;
        b.className = 'badge' + (kind ? ' ' + kind : '');
        b.innerHTML = '';
        if (animate) {
            var d = document.createElement('span');
            d.className = 'dot';
            b.appendChild(d);
        }
        b.appendChild(document.createTextNode(text));
    }

    function showRun() {
        var home = el('initial-screen');
        var run = el('exploit-main-screen');
        if (home) home.classList.add('hidden');
        if (run) run.classList.remove('hidden');
        var resetScroll = function () {
            document.documentElement.scrollLeft = 0;
            document.body.scrollLeft = 0;
            window.scrollTo(0, 0);
        };
        resetScroll();
        setTimeout(resetScroll, 60);
        setTimeout(resetScroll, 320);
        setBadge('', 'Jailbreaking\u2026', true);
    }

    function startJailbreak() {
        if (typeof user !== 'undefined' && user.blockJailbreak) return;
        if (!isPS4Console() && typeof devMode === 'undefined') {
            setBadge('bad', 'Console only');
            return;
        }
        if (typeof user !== 'undefined') user.blockJailbreak = true;
        showRun();
        try {
            if (typeof chooseHEN === 'function') chooseHEN();
            jailbreak();
        } catch (e) {
            setBadge('bad', 'Error: ' + (e && e.message ? e.message : e));
        }
    }

    /* ------------------------------------------------------------- bootstrap */
    function bind() {
        var s = el('startBtn');
        if (s) s.onclick = startJailbreak;

        var back = el('backBtn');
        if (back) back.onclick = function () { location.reload(); };

        var cache = el('cacheBtn');
        if (cache) cache.onclick = function () {
            window.location.href = (typeof testModeUrl === 'function') ? testModeUrl('./cache.html') : './cache.html';
        };

        var gear = el('gearBtn');
        if (gear) gear.onclick = function () { openSheet('sheet'); };
        var payBtn = el('payloadBtn');
        if (payBtn) payBtn.onclick = function () {
            if (!payRendered) renderPayloads(currentTab);
            openSheet('paySheet');
        };

        var sc = el('sheetClose');
        if (sc) sc.onclick = closeSheets;
        var pc = el('payClose');
        if (pc) pc.onclick = closeSheets;
        var scrim = el('scrim');
        if (scrim) scrim.onclick = closeSheets;

        if (typeof user !== 'undefined') {
            user.currentJbFlavor = HEN;
            try { storage.set('jailbreakFlavor', HEN); } catch (e) {}
        }
        if (typeof user !== 'undefined' && (user.exploitChain === null || isNaN(user.exploitChain))) {
            exploitChain(currentChain());
        }

        paintFw();
        paintHen();
        buildChains();
    }

    function boot() {
        if (typeof storage === 'undefined' || typeof FIRMWARE_RANGES === 'undefined') return;
        if (window.abortLoading) return;

        window.exploitChain = exploitChain;
        window.loadExploitChain = loadExploitChain;

        try { CheckFW(); } catch (e) { console.warn('CheckFW', e); }

        var arming = false;
        try { arming = storage.session.getBoolean('jailbreakNow', false); } catch (e) {}
        if (arming) showRun();

        var afterLang = function () {
            try { if (typeof autoJailbreak === 'function') autoJailbreak(); } catch (e) {}
        };
        if (typeof initLanguage === 'function') {
            initLanguage().then(afterLang, afterLang);
        } else {
            afterLang();
        }

        bind();

        var st = el('state');
        if (st && window.MutationObserver) {
            new MutationObserver(function () {
                var t = (st.textContent || '').trim();
                if (!t) return;
                if (/DONE|success/i.test(t)) setBadge('ok', 'Jailbroken');
                else if (/Restored/i.test(t)) setBadge('', 'Back to the start page\u2026', true);
                else if (/Restart/i.test(t)) setBadge('bad', 'Restart your console');
                else if (/Refresh/i.test(t)) setBadge('bad', 'Refresh the page and try again');
            }).observe(st, { childList: true, characterData: true, subtree: true });
        }

        var orig = window.jailbreakSuccess;
        if (typeof orig === 'function' && !orig.__lp) {
            var wrapped = function () {
                try { orig.apply(this, arguments); } catch (e) {}
                setBadge('ok', 'Jailbroken');
            };
            wrapped.__lp = true;
            window.jailbreakSuccess = wrapped;
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
