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

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(section);
});

// Parallax effect for gradient orbs
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = 0.1 + (index * 0.05);
        orb.style.transform = `translate(${scrolled * speed}px, ${scrolled * speed}px)`;
    });
});

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

    if (formEl && inputEl) {
        formEl.addEventListener('submit', async (event) => {
            event.preventDefault();
            const text = inputEl.value.trim();
            if (!text) return;
            appendMessage('user', text);
            inputEl.value = '';
            inputEl.disabled = true;

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
                const reply = data?.choices?.[0]?.message?.content;
                const sessionId = data?.vi?.sessionId;
                if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
                appendMessage('assistant', reply || 'Vi did not return a reply this turn.');
            } catch (error) {
                const msg = (error && error.message) ? error.message : 'Vi is warming up. Please try again shortly.';
                appendMessage('assistant', msg);
            } finally {
                inputEl.disabled = false;
                inputEl.focus();
            }
        });
    }
}

console.log('%cTentai Technology', 'color: #E7C26A; font-size: 18px; font-weight: bold;');
console.log('%ctentaitech.com — Vi, Vigil, and client services', 'color: #C9A84C; font-size: 12px;');
