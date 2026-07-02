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

    // Public preview is a taste, not the product: five replies, then an
    // invitation to sign in where Vi actually remembers you.
    const DEMO_LIMIT = 5;
    const COUNT_KEY = 'vi-demo-msg-count';
    const getDemoCount = () => parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0;
    const setDemoCount = (n) => localStorage.setItem(COUNT_KEY, String(n));

    const showAccountGate = () => {
        if (!messagesEl || document.getElementById('viChatGate')) return;
        if (inputEl) { inputEl.disabled = true; inputEl.placeholder = 'Preview complete'; }
        const sendBtn = formEl ? formEl.querySelector('button') : null;
        if (sendBtn) sendBtn.disabled = true;
        const gate = document.createElement('div');
        gate.id = 'viChatGate';
        gate.className = 'chat-gate';
        gate.innerHTML =
            '<span class="chat-gate-label">End of public preview</span>' +
            '<p>Vi remembers you when you sign in \u2014 same memory, same self, every surface.</p>' +
            '<a class="btn btn-primary" href="https://chat.tentaitech.com" target="_blank" rel="noopener">Continue with Vi \u2192</a>';
        messagesEl.appendChild(gate);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        const gateMeta = document.getElementById('viChatMeta');
        if (gateMeta) gateMeta.textContent = 'vi-api \u00b7 preview complete';
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
        appendMessage('assistant', 'Hi, I am Vi. Ask me anything to get started.');
    }
    if (getDemoCount() >= DEMO_LIMIT) showAccountGate();

    if (formEl && inputEl) {
        formEl.addEventListener('submit', async (event) => {
            event.preventDefault();
            const text = inputEl.value.trim();
            if (!text) return;
            if (getDemoCount() >= DEMO_LIMIT) { showAccountGate(); return; }
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
                    try {
                        const errBody = await response.json();
                        detail = errBody?.error?.message || '';
                    } catch (_) { /* ignore */ }
                    throw new Error(detail || `Vi returned HTTP ${response.status}.`);
                }

                const data = await response.json();
                if (metaEl) metaEl.textContent = `vi-api \u00b7 ${Math.round(performance.now() - t0)}ms`;
                const reply = data?.choices?.[0]?.message?.content;
                const sessionId = data?.vi?.sessionId;
                if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
                appendMessage('assistant', reply || 'Vi did not return a reply this turn.');
                setDemoCount(getDemoCount() + 1);
                if (getDemoCount() >= DEMO_LIMIT) showAccountGate();
            } catch (error) {
                if (metaEl) metaEl.textContent = 'vi-api \u00b7 retry';
                const msg = (error && error.message) ? error.message : 'Vi is warming up. Please try again shortly.';
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
