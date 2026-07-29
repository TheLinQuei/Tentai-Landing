// Tentai contact modal — every "work with Tentai" button opens a real form
// (no mailto dead-ends). Posts to the same vi-api lead pipeline as the chat
// console and side panel, so submissions land in Postgres and ping the owner
// instantly. Self-contained: injects its own styles and DOM; config from the
// <script> tag (data-api-base, data-api-key). Any element with a
// data-contact="<topic>" attribute opens it; the topic rides in `source`.
(() => {
    const script = document.currentScript;
    if (!script) return;
    const apiBase = script.dataset.apiBase || 'https://vi-api-zr7hl3nzja-uc.a.run.app';
    const apiKey = script.dataset.apiKey || '';

    const css = `
    .vicm-overlay{position:fixed;inset:0;z-index:9500;background:rgba(6,5,3,.72);backdrop-filter:blur(3px);
      display:none;align-items:center;justify-content:center;padding:1rem}
    .vicm-overlay.open{display:flex}
    .vicm-card{width:min(440px,100%);max-height:calc(100vh - 2rem);overflow-y:auto;border-radius:10px;
      border:1px solid rgba(212,184,118,.4);background:#0D0B08;box-shadow:0 16px 64px rgba(0,0,0,.65);
      padding:1.5rem 1.4rem;font-family:Inter,system-ui,sans-serif;color:#e8e2d6;position:relative}
    .vicm-close{position:absolute;top:.7rem;right:.85rem;background:none;border:none;color:#D4B876;
      font-size:1.2rem;cursor:pointer;line-height:1}
    .vicm-label{display:block;font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:.16em;
      text-transform:uppercase;color:#D4B876;margin-bottom:.5rem}
    .vicm-title{font-family:Georgia,'Fraunces',serif;font-size:1.35rem;margin:0 0 .4rem;color:#f4efe3}
    .vicm-sub{font-size:.88rem;line-height:1.55;opacity:.8;margin:0 0 1.1rem}
    .vicm-form{display:flex;flex-direction:column;gap:.6rem}
    .vicm-form input,.vicm-form textarea{width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(212,184,118,.3);
      border-radius:6px;padding:.65rem .75rem;font-size:.9rem;color:#e8e2d6;font-family:inherit;resize:vertical}
    .vicm-form input::placeholder,.vicm-form textarea::placeholder{opacity:.55}
    .vicm-form button{background:radial-gradient(circle at 50% 35%, #D4B876 0%, #B8963F 80%);border:none;
      border-radius:6px;color:#0D0B08;font-weight:600;font-size:.92rem;padding:.75rem;cursor:pointer;margin-top:.2rem}
    .vicm-form button:disabled{opacity:.5;cursor:default}
    .vicm-alt{font-size:.75rem;opacity:.65;margin-top:.7rem;text-align:center}
    .vicm-alt a{color:#D4B876}
    .vicm-hp{position:absolute !important;left:-9999px !important;height:0;opacity:0;pointer-events:none}
    .vicm-err{color:#d47676;font-size:.8rem;margin-top:.2rem}
    .vicm-ok{font-size:.95rem;line-height:1.6;padding:1rem 0}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'vicm-overlay';
    overlay.innerHTML =
        '<div class="vicm-card" role="dialog" aria-modal="true" aria-label="Contact Tentai">' +
        '<button class="vicm-close" aria-label="Close">×</button>' +
        '<span class="vicm-label">Work with Tentai</span>' +
        '<h3 class="vicm-title">Start the conversation</h3>' +
        '<p class="vicm-sub">Tell us what you need — Shykem reads every message and replies personally.</p>' +
        '<form class="vicm-form" autocomplete="off">' +
        '<input name="name" type="text" placeholder="Name" maxlength="120">' +
        '<input name="email" type="email" placeholder="Email" maxlength="254">' +
        '<input name="phone" type="tel" placeholder="Phone" maxlength="40">' +
        '<textarea name="note" rows="4" placeholder="What do you need? A website, booking automation, AI in your business — say it plainly." maxlength="2000"></textarea>' +
        '<input name="company" class="vicm-hp" type="text" tabindex="-1" aria-hidden="true">' +
        '<button type="submit">Send</button>' +
        '</form>' +
        '<p class="vicm-alt">Prefer email? <a href="mailto:shykem.middleton@tentaitech.com">shykem.middleton@tentaitech.com</a></p>' +
        '</div>';
    document.body.appendChild(overlay);

    const card = overlay.querySelector('.vicm-card');
    const form = overlay.querySelector('.vicm-form');
    let currentTopic = 'contact';
    let lastTrigger = null;

    // Opening supersedes the mobile veil menu — some triggers (mnav CTA,
    // floating widgets) are reachable while the veil is up, and stacking on
    // top of it would leave the menu and its scroll lock live underneath.
    const dismissVeil = () => {
        if (!document.body.classList.contains('mnav-open')) return;
        document.body.classList.remove('mnav-open');
        const burger = document.querySelector('.mnav-burger');
        if (burger) burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    const close = () => {
        if (!overlay.classList.contains('open')) return;
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
        lastTrigger = null;
    };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.vicm-close').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); return; }
        // Focus trap — Tab/Shift+Tab cycle inside the open dialog (aria-modal contract).
        if (e.key !== 'Tab' || !overlay.classList.contains('open')) return;
        const focusables = [...card.querySelectorAll('button, [href], input, textarea')]
            .filter(el => !el.disabled && el.tabIndex >= 0);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey ? (active === first || !card.contains(active))
                       : (active === last || !card.contains(active))) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
        }
    });

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-contact]');
        if (!trigger) return;
        e.preventDefault();
        dismissVeil();
        currentTopic = trigger.getAttribute('data-contact') || 'contact';
        lastTrigger = trigger;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        const first = form?.querySelector('input[name="name"]');
        if (first) first.focus();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        if (!String(fd.get('email') || '').trim() && !String(fd.get('phone') || '').trim()) {
            let err = form.querySelector('.vicm-err');
            if (!err) {
                err = document.createElement('p');
                err.className = 'vicm-err';
                form.appendChild(err);
            }
            err.textContent = 'An email or phone number is needed so Shykem can reach you.';
            return;
        }
        const btn = form.querySelector('button');
        btn.disabled = true; btn.textContent = 'Sending…';
        try {
            const res = await fetch(`${apiBase}/frontdesk/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
                body: JSON.stringify({
                    name: fd.get('name') || '',
                    email: fd.get('email') || '',
                    phone: fd.get('phone') || '',
                    note: fd.get('note') || '',
                    company: fd.get('company') || '',
                    source: `tentaitech.com · ${currentTopic} · ${location.pathname}`,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            form.outerHTML = '<p class="vicm-ok">Received. Shykem will reach out personally — usually the same day.</p>';
        } catch (_) {
            btn.disabled = false; btn.textContent = 'Send';
            let err = form.querySelector('.vicm-err');
            if (!err) {
                err = document.createElement('p');
                err.className = 'vicm-err';
                form.appendChild(err);
            }
            err.textContent = 'Could not send — please email shykem.middleton@tentaitech.com instead.';
        }
    });

    // Card scrolls internally; stop overlay clicks inside the card from closing.
    card.addEventListener('click', (e) => e.stopPropagation());
})();
