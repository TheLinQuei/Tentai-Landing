// iOS Install Modal
function showIOSInstructions() {
    const modal = document.getElementById('iosModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeIOSModal() {
    const modal = document.getElementById('iosModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Smooth scroll with offset for fixed header
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Section reveal — one-shot, settles and stops. Respects reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(12px)';
        observer.observe(section);
    });
}

// Sticky nav — tighten once the visitor commits to scrolling
const navEl = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navEl) navEl.classList.toggle('scrolled', window.pageYOffset > 40);
}, { passive: true });

// Update scroll indicator visibility
window.addEventListener('scroll', () => {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        if (window.pageYOffset > 100) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }
    }
});

// Download tracking (console log for now)
document.querySelectorAll('a[download]').forEach(link => {
    link.addEventListener('click', (e) => {
        const platform = e.currentTarget.textContent.trim();
        console.log(`Download initiated: ${platform}`);
        
        // Show download started notification
        showNotification(`Opening Vi for ${platform}...`);
    });
});

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Prevent default drag on images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('dragstart', e => e.preventDefault());
});

// Test chat widget — talks to Vi via the OpenAI-dialect adapter
// (POST /v1/chat/completions). Session continuity within the visitor's
// browser is handled by storing the X-Vi-Session-Id Vi returns and
// sending it back on subsequent turns.
const testChat = document.querySelector('.test-chat');
if (testChat) {
    const apiBase = testChat.dataset.apiBase || 'https://vi-api-zr7hl3nzja-uc.a.run.app';
    const apiKey = testChat.dataset.apiKey || '';
    const model = testChat.dataset.model || 'vi';
    const messagesEl = document.getElementById('testChatMessages');
    const formEl = document.getElementById('testChatForm');
    const inputEl = document.getElementById('testChatInput');

    // Persist Vi's sessionId across page reloads so the same visitor in
    // the same browser gets continuity. Cleared if the user opens a new
    // browser / private tab.
    const SESSION_KEY = 'vi-demo-session-id';

    // No client-side message cap (owner call, 2026-07-04) \u2014 the server keeps
    // quiet abuse ceilings. The gate appears only when the server says the
    // session is done (402) or the visitor asks to leave contact details.
    // Gate copy for the session-end case is Vi's own authored wording
    // (PUBLIC_TIER_CHARTER, 2026-07-03).
    const showAccountGate = (reason = 'manual') => {
        if (!messagesEl || document.getElementById('viChatGate')) return;
        if (reason === 'limit') {
            if (inputEl) { inputEl.disabled = true; inputEl.placeholder = 'Session concluded'; }
            const sendBtn = formEl ? formEl.querySelector('button') : null;
            if (sendBtn) sendBtn.disabled = true;
        }
        const gate = document.createElement('div');
        gate.id = 'viChatGate';
        gate.className = 'chat-gate';
        gate.innerHTML =
            (reason === 'limit'
                ? '<span class="chat-gate-label">End of public preview</span>' +
                  '<p>Your demo session has concluded. To book a consultation or discuss integrating Tentai Tech\u2019s services, please sign in or leave your contact details.</p>'
                : '<span class="chat-gate-label">Leave your contact details</span>' +
                  '<p>To book a consultation or discuss integrating Tentai Tech\u2019s services, leave your details and Shykem will reach out personally.</p>') +
            '<form id="viLeadForm" class="lead-form" autocomplete="off">' +
                '<input name="name" type="text" placeholder="Name (optional)" maxlength="120">' +
                '<input name="email" type="email" placeholder="Email" maxlength="254">' +
                '<input name="phone" type="tel" placeholder="Phone" maxlength="40">' +
                '<textarea name="note" rows="2" placeholder="What do you need? (optional)" maxlength="2000"></textarea>' +
                '<input name="company" class="lead-hp" type="text" tabindex="-1" aria-hidden="true">' +
                '<button type="submit" class="btn btn-primary">Leave contact details</button>' +
            '</form>' +
            '<p class="lead-alt"><a href="https://chat.tentaitech.com" target="_blank" rel="noopener">Sign in at chat.tentaitech.com</a> \u00b7 or email <a href="mailto:shykem.middleton@tentaitech.com">shykem.middleton@tentaitech.com</a></p>';
        messagesEl.appendChild(gate);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (reason === 'limit') {
            const gateMeta = document.getElementById('viChatMeta');
            if (gateMeta) gateMeta.textContent = 'vi-api \u00b7 session concluded';
        }

        const leadForm = document.getElementById('viLeadForm');
        if (leadForm) {
            leadForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const fd = new FormData(leadForm);
                if (!String(fd.get('email') || '').trim() && !String(fd.get('phone') || '').trim()) {
                    leadForm.querySelector('input[name="email"]').focus();
                    return;
                }
                const submitBtn = leadForm.querySelector('button');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending\u2026'; }
                try {
                    const res = await fetch(`${apiBase}/frontdesk/lead`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
                        },
                        body: JSON.stringify({
                            name: fd.get('name') || '',
                            email: fd.get('email') || '',
                            phone: fd.get('phone') || '',
                            note: fd.get('note') || '',
                            company: fd.get('company') || '',
                            source: 'tentaitech.com \u00b7 hero console',
                        }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    leadForm.outerHTML = '<p class="lead-confirm">Received. Shykem will reach out personally.</p>';
                } catch (_) {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Leave contact details'; }
                    let err = document.getElementById('viLeadError');
                    if (!err) {
                        err = document.createElement('p');
                        err.id = 'viLeadError';
                        err.className = 'lead-error';
                        leadForm.appendChild(err);
                    }
                    err.textContent = 'Could not send \u2014 please email shykem.middleton@tentaitech.com instead.';
                }
            });
        }
    };

    const appendMessage = (role, text) => {
        if (!messagesEl) return;
        const message = document.createElement('div');
        message.className = `test-chat-message ${role}`;
        message.textContent = text;
        messagesEl.appendChild(message);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    if (messagesEl && messagesEl.children.length === 0) {
        appendMessage('assistant', 'Tentai front desk — the public interface of Vi. Ask about services, timelines, or booking a consultation.');
    }
    // "Leave contact details" link under the console opens the lead form
    // without ending the chat.
    const leadLink = document.getElementById('viLeadLink');
    if (leadLink) {
        leadLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAccountGate('manual');
        });
    }

    if (formEl && inputEl) {
        formEl.addEventListener('submit', async (event) => {
            event.preventDefault();
            const text = inputEl.value.trim();
            if (!text) return;
            appendMessage('user', text);
            inputEl.value = '';
            inputEl.disabled = true;
            const metaEl = document.getElementById('viChatMeta');
            if (metaEl) metaEl.textContent = 'vi-api \u00b7 thinking\u2026';
            const t0 = performance.now();

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
                // X-Vi-Session-Id preserves Vi's session continuity across
                // turns within the same browser. vi-api's CORS allowedHeaders
                // includes x-vi-session-id, so the preflight allows it.
                const existingSession = localStorage.getItem(SESSION_KEY);
                if (existingSession) headers['X-Vi-Session-Id'] = existingSession;

                const response = await fetch(`${apiBase}/v1/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: text }],
                        stream: false,
                    }),
                });

                if (!response.ok) {
                    // Try to surface the actual error message Vi sent back
                    let detail = '';
                    let code = '';
                    try {
                        const errBody = await response.json();
                        detail = errBody?.error?.message || '';
                        code = errBody?.error?.code || '';
                    } catch (_) { /* ignore */ }
                    // Server-side session ceiling -> show the gate instead of an error.
                    if (code === 'SIGNUP_REQUIRED' || response.status === 402) {
                        showAccountGate('limit');
                        return;
                    }
                    throw new Error(detail || `The front desk returned HTTP ${response.status}.`);
                }

                const data = await response.json();
                if (metaEl) metaEl.textContent = `vi-api \u00b7 ${Math.round(performance.now() - t0)}ms`;
                const reply = data?.choices?.[0]?.message?.content;
                const sessionId = data?.vi?.sessionId;
                if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
                appendMessage('assistant', reply || 'No reply this turn — please try again.');
            } catch (error) {
                if (metaEl) metaEl.textContent = 'vi-api \u00b7 retry';
                const msg = (error && error.message) ? error.message : 'The front desk is starting up. Please try again shortly.';
                appendMessage('assistant', msg);
            } finally {
                const gated = !!document.getElementById('viChatGate');
                inputEl.disabled = gated;
                if (!gated) inputEl.focus();
            }
        });
    }
}

console.log('%cTentai Technology', 'font-family: Georgia, serif; color: #D4B876; font-size: 18px;');
console.log('%ctentaitech.com \u00b7 Vi \u00b7 Vigil \u00b7 client services \u00b7 v1.0.0', 'font-family: monospace; color: #B8963F; font-size: 11px; letter-spacing: 1px;');
