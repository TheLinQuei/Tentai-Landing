// Tentai front-desk side panel — a floating chat bubble on every page that
// opens a slide-in panel to the same front desk as the hero console.
// Self-contained: injects its own styles and DOM; config comes from the
// <script> tag's data attributes (data-api-base, data-api-key).
//
// Shares localStorage state with the hero console (vi-demo-session-id,
// vi-demo-msg-count) so the 5-message public preview is one budget site-wide,
// and the same conversation continues across pages. Gate copy is Vi's own
// authored wording (PUBLIC_TIER_CHARTER, 2026-07-03).
(() => {
    const script = document.currentScript;
    if (!script) return;
    const apiBase = script.dataset.apiBase || 'https://vi-api-zr7hl3nzja-uc.a.run.app';
    const apiKey = script.dataset.apiKey || '';
    const SESSION_KEY = 'vi-demo-session-id';

    const css = `
    .vifd-bubble{position:fixed;right:1.25rem;bottom:1.25rem;z-index:9000;width:56px;height:56px;border-radius:50%;
      border:1px solid rgba(212,184,118,.55);background:radial-gradient(circle at 50% 35%, #D4B876 0%, #B8963F 70%);
      color:#0D0B08;font-family:Georgia,'Fraunces',serif;font-size:1.35rem;font-weight:500;cursor:pointer;
      box-shadow:0 4px 24px rgba(0,0,0,.45);transition:transform .18s ease;display:flex;align-items:center;justify-content:center}
    .vifd-bubble:hover{transform:scale(1.06)}
    .vifd-panel{position:fixed;right:1.25rem;bottom:5.75rem;z-index:9001;width:min(370px,calc(100vw - 2rem));
      max-height:min(540px,calc(100vh - 8rem));display:none;flex-direction:column;overflow:hidden;border-radius:10px;
      border:1px solid rgba(212,184,118,.35);background:#0D0B08;box-shadow:0 12px 48px rgba(0,0,0,.6);
      font-family:Inter,system-ui,sans-serif;color:#e8e2d6}
    .vifd-panel.open{display:flex}
    .vifd-head{display:flex;align-items:center;justify-content:space-between;padding:.7rem .9rem;
      border-bottom:1px solid rgba(212,184,118,.25);font-family:'JetBrains Mono',monospace;font-size:.66rem;
      letter-spacing:.12em;text-transform:uppercase;color:#D4B876}
    .vifd-head .vifd-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#8fce6f;margin-right:.45rem}
    .vifd-close{background:none;border:none;color:#D4B876;font-size:1.05rem;cursor:pointer;line-height:1;padding:.1rem .3rem}
    .vifd-msgs{flex:1;overflow-y:auto;padding:.9rem;display:flex;flex-direction:column;gap:.55rem;min-height:180px}
    .vifd-msg{max-width:88%;padding:.55rem .7rem;border-radius:8px;font-size:.86rem;line-height:1.5;white-space:pre-wrap}
    .vifd-msg.assistant{align-self:flex-start;background:rgba(212,184,118,.07);border:1px solid rgba(212,184,118,.18)}
    .vifd-msg.user{align-self:flex-end;background:rgba(212,184,118,.16);color:#f4efe3}
    .vifd-form{display:flex;gap:.5rem;padding:.7rem .9rem;border-top:1px solid rgba(212,184,118,.25)}
    .vifd-form input{flex:1;background:rgba(0,0,0,.4);border:1px solid rgba(212,184,118,.3);border-radius:6px;
      padding:.55rem .7rem;font-size:.86rem;color:#e8e2d6;font-family:inherit}
    .vifd-form input:disabled{opacity:.45}
    .vifd-form button{background:rgba(212,184,118,.14);border:1px solid rgba(212,184,118,.4);border-radius:6px;
      color:#D4B876;font-size:.8rem;padding:.55rem .85rem;cursor:pointer}
    .vifd-form button:disabled{opacity:.35;cursor:default}
    .vifd-note{text-align:center;font-family:'JetBrains Mono',monospace;font-size:.6rem;letter-spacing:.06em;
      color:rgba(232,226,214,.45);padding:0 .9rem .7rem}
    .vifd-gate{margin:.4rem .9rem .9rem;padding:.9rem;border:1px solid rgba(212,184,118,.35);border-radius:8px;
      background:rgba(212,184,118,.04);font-size:.83rem;line-height:1.5}
    .vifd-gate .vifd-gate-label{display:block;font-family:'JetBrains Mono',monospace;font-size:.58rem;letter-spacing:.14em;
      text-transform:uppercase;color:#D4B876;margin-bottom:.45rem}
    .vifd-gate form{display:flex;flex-direction:column;gap:.5rem;margin-top:.7rem}
    .vifd-gate input,.vifd-gate textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(212,184,118,.3);
      border-radius:5px;padding:.5rem .65rem;font-size:.83rem;color:#e8e2d6;font-family:inherit;resize:vertical}
    .vifd-gate button{background:radial-gradient(circle at 50% 35%, #D4B876 0%, #B8963F 80%);border:none;border-radius:6px;
      color:#0D0B08;font-weight:600;font-size:.83rem;padding:.6rem;cursor:pointer}
    .vifd-gate .vifd-alt{font-size:.72rem;opacity:.7;margin-top:.5rem}
    .vifd-gate .vifd-alt a{color:#D4B876}
    .vifd-hp{position:absolute !important;left:-9999px !important;height:0;opacity:0;pointer-events:none}
    .vifd-err{color:#d47676;font-size:.75rem;margin-top:.35rem}
    @media (max-width:480px){.vifd-panel{right:.5rem;left:.5rem;width:auto;bottom:5.25rem}}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const bubble = document.createElement('button');
    bubble.className = 'vifd-bubble';
    bubble.setAttribute('aria-label', 'Open the Tentai front desk chat');
    bubble.textContent = 'Vi';
    const panel = document.createElement('div');
    panel.className = 'vifd-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Tentai front desk');
    panel.innerHTML =
        '<div class="vifd-head"><span><span class="vifd-dot"></span>vi.public · front desk</span>' +
        '<button class="vifd-close" aria-label="Close">×</button></div>' +
        '<div class="vifd-msgs"></div>' +
        '<form class="vifd-form" autocomplete="off">' +
        '<input type="text" placeholder="Ask about services, pricing, or booking..." aria-label="Message the front desk">' +
        '<button type="submit">Send</button></form>' +
        '<p class="vifd-note"><a href="#" class="vifd-lead-link">Leave contact details →</a></p>';
    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    const msgsEl = panel.querySelector('.vifd-msgs');
    const formEl = panel.querySelector('.vifd-form');
    const inputEl = formEl.querySelector('input');
    const sendBtn = formEl.querySelector('button');

    const append = (role, text) => {
        const m = document.createElement('div');
        m.className = `vifd-msg ${role}`;
        m.textContent = text;
        msgsEl.appendChild(m);
        msgsEl.scrollTop = msgsEl.scrollHeight;
    };

    const showGate = (reason = 'manual') => {
        if (panel.querySelector('.vifd-gate')) return;
        if (reason === 'limit') {
            inputEl.disabled = true;
            inputEl.placeholder = 'Session concluded';
            sendBtn.disabled = true;
        }
        const gate = document.createElement('div');
        gate.className = 'vifd-gate';
        gate.innerHTML =
            (reason === 'limit'
                ? '<span class="vifd-gate-label">End of public preview</span>' +
                  'Your demo session has concluded. To book a consultation or discuss integrating Tentai Tech’s services, please sign in or leave your contact details.'
                : '<span class="vifd-gate-label">Leave your contact details</span>' +
                  'To book a consultation or discuss integrating Tentai Tech’s services, leave your details and Shykem will reach out personally.') +
            '<form autocomplete="off">' +
            '<input name="name" type="text" placeholder="Name (optional)" maxlength="120">' +
            '<input name="email" type="email" placeholder="Email" maxlength="254">' +
            '<input name="phone" type="tel" placeholder="Phone" maxlength="40">' +
            '<textarea name="note" rows="2" placeholder="What do you need? (optional)" maxlength="2000"></textarea>' +
            '<input name="company" class="vifd-hp" type="text" tabindex="-1" aria-hidden="true">' +
            '<button type="submit">Leave contact details</button>' +
            '</form>' +
            '<p class="vifd-alt"><a href="https://chat.tentaitech.com" target="_blank" rel="noopener">Sign in at chat.tentaitech.com</a> · or email <a href="mailto:shykem.middleton@tentaitech.com">shykem.middleton@tentaitech.com</a></p>';
        msgsEl.appendChild(gate);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        const leadForm = gate.querySelector('form');
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(leadForm);
            if (!String(fd.get('email') || '').trim() && !String(fd.get('phone') || '').trim()) {
                leadForm.querySelector('input[name="email"]').focus();
                return;
            }
            const btn = leadForm.querySelector('button');
            btn.disabled = true; btn.textContent = 'Sending…';
            try {
                const res = await fetch(`${apiBase}/frontdesk/lead`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
                    body: JSON.stringify({
                        name: fd.get('name') || '', email: fd.get('email') || '',
                        phone: fd.get('phone') || '',
                        note: fd.get('note') || '', company: fd.get('company') || '',
                        source: `tentaitech.com · side panel · ${location.pathname}`,
                    }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                leadForm.outerHTML = '<p style="margin-top:.7rem">Received. Shykem will reach out personally.</p>';
            } catch (_) {
                btn.disabled = false; btn.textContent = 'Leave contact details';
                if (!leadForm.querySelector('.vifd-err')) {
                    const err = document.createElement('p');
                    err.className = 'vifd-err';
                    err.textContent = 'Could not send — please email shykem.middleton@tentaitech.com instead.';
                    leadForm.appendChild(err);
                }
            }
        });
    };

    let greeted = false;
    const openPanel = () => {
        panel.classList.add('open');
        if (!greeted) {
            greeted = true;
            append('assistant', 'Tentai front desk — the public interface of Vi. Ask about services, timelines, or booking a consultation.');
        }
        if (!inputEl.disabled) inputEl.focus();
    };
    panel.querySelector('.vifd-lead-link').addEventListener('click', (e) => {
        e.preventDefault();
        showGate('manual');
    });

    // Any element with data-open-frontdesk opens the panel — the hero
    // "Talk to Vi" CTA, the nav "Chat" links, footer links.
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-open-frontdesk]');
        if (!trigger) return;
        e.preventDefault();
        openPanel();
    });

    // Auto-open: once per visitor per 7 days, on real engagement (45% scroll
    // or 30s on page), never again in-visit after a manual close. The front
    // desk introduces itself without becoming the widget people learn to hate.
    const AUTO_KEY = 'vifd-auto-opened-at';
    let manuallyClosed = false;
    let autoArmed = true;
    const maybeAutoOpen = () => {
        if (!autoArmed || manuallyClosed || panel.classList.contains('open')) return;
        const last = parseInt(localStorage.getItem(AUTO_KEY) || '0', 10);
        if (Date.now() - last < 7 * 24 * 60 * 60 * 1000) return;
        autoArmed = false;
        localStorage.setItem(AUTO_KEY, String(Date.now()));
        openPanel();
    };
    // Engagement signal: reaching the Services section (same IO pattern the
    // site's section reveals use). Pages without #services fall back to a
    // 45% scroll-depth check; a 30s dwell timer backstops both.
    const servicesEl = document.getElementById('services');
    if (servicesEl && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((en) => en.isIntersecting)) {
                io.disconnect();
                maybeAutoOpen();
            }
        }, { threshold: 0.2 });
        io.observe(servicesEl);
    } else {
        const onScrollDepth = () => {
            const doc = document.documentElement;
            const depth = (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
            if (depth > 0.45) {
                window.removeEventListener('scroll', onScrollDepth);
                maybeAutoOpen();
            }
        };
        window.addEventListener('scroll', onScrollDepth, { passive: true });
    }
    setTimeout(maybeAutoOpen, 30_000);
    bubble.addEventListener('click', () => {
        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
            manuallyClosed = true;
        } else {
            openPanel();
        }
    });
    panel.querySelector('.vifd-close').addEventListener('click', () => {
        panel.classList.remove('open');
        manuallyClosed = true;
    });

    formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = inputEl.value.trim();
        if (!text) return;
        append('user', text);
        inputEl.value = '';
        inputEl.disabled = true;
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            const existing = localStorage.getItem(SESSION_KEY);
            if (existing) headers['X-Vi-Session-Id'] = existing;
            const res = await fetch(`${apiBase}/v1/chat/completions`, {
                method: 'POST', headers,
                body: JSON.stringify({ model: 'vi', messages: [{ role: 'user', content: text }], stream: false }),
            });
            if (!res.ok) {
                let detail = '';
                let code = '';
                try {
                    const errBody = await res.json();
                    detail = errBody?.error?.message || '';
                    code = errBody?.error?.code || '';
                } catch (_) { /* ignore */ }
                if (code === 'SIGNUP_REQUIRED' || res.status === 402) { showGate('limit'); return; }
                throw new Error(detail || `The front desk returned HTTP ${res.status}.`);
            }
            const data = await res.json();
            const sessionId = data?.vi?.sessionId;
            if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
            append('assistant', data?.choices?.[0]?.message?.content || 'No reply this turn — please try again.');
        } catch (err) {
            append('assistant', (err && err.message) ? err.message : 'The front desk is starting up. Please try again shortly.');
        } finally {
            if (!panel.querySelector('.vifd-gate')) { inputEl.disabled = false; inputEl.focus(); }
        }
    });
})();
