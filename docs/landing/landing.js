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

// Mobile nav — obsidian veil. Burger appears ≤640px where .nav-links hides.
// Menu links are cloned from this page's navbar, so index and about stay in
// sync with their own link sets; the CTA wires to the contact modal.
(function () {
    const navContent = document.querySelector('.navbar .nav-content');
    const navLinks = document.querySelectorAll('.navbar .nav-links a');
    if (!navContent || !navLinks.length) return;

    const burger = document.createElement('button');
    burger.className = 'mnav-burger';
    burger.setAttribute('aria-label', 'Open navigation menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'mnav');
    burger.innerHTML = '<span></span><span></span><span></span>';
    navContent.appendChild(burger);

    const menu = document.createElement('nav');
    menu.className = 'mnav';
    menu.id = 'mnav';
    menu.setAttribute('aria-label', 'Menu');
    let i = 0;
    navLinks.forEach(a => {
        const link = a.cloneNode(true);
        link.style.setProperty('--i', i++);
        menu.appendChild(link);
    });
    const cta = document.createElement('a');
    cta.href = '#';
    cta.setAttribute('data-contact', 'start a project');
    cta.className = 'mnav-cta';
    cta.style.setProperty('--i', i);
    cta.textContent = 'Start a project';
    menu.appendChild(cta);
    document.body.appendChild(menu);

    const setOpen = open => {
        document.body.classList.toggle('mnav-open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setOpen(!document.body.classList.contains('mnav-open')));
    // capture phase: close (and release scroll-lock) before the link's own handler scrolls
    menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); }, true);
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.body.classList.contains('mnav-open')) setOpen(false);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 640 && document.body.classList.contains('mnav-open')) setOpen(false);
    }, { passive: true });
})();

// Vi band — sticky mobile CTA (≤640px). Once the visitor commits past the
// hero, the chat bubble becomes a bar: Talk to Vi + Start a project. The
// gate has hysteresis so the band doesn't flicker at the threshold; the
// scroll hook lives in the consolidated scroll handler below.
(function () {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const band = document.createElement('div');
    band.className = 'viband';
    band.id = 'viband';
    band.setAttribute('role', 'group');
    band.setAttribute('aria-label', 'Quick actions');
    band.innerHTML =
        '<a href="#" data-open-frontdesk class="viband-face"><span class="viband-dot" aria-hidden="true">Vi</span><span>Talk to Vi</span></a>' +
        '<a href="#" data-contact="start a project" class="viband-cta">Start a project</a>';
    // right after the navbar: tab order matches its persistent visual role
    navbar.insertAdjacentElement('afterend', band);

    const hero = document.querySelector('.hero');
    window.tentaiCtaGate = function () {
        if (window.innerWidth > 640) { document.body.classList.remove('cta-on'); return; }
        const arm = hero ? Math.max(320, Math.round(hero.offsetHeight * 0.55)) : 420;
        const y = window.pageYOffset;
        if (y > arm) document.body.classList.add('cta-on');
        else if (y < arm - 90) document.body.classList.remove('cta-on');
    };
    window.addEventListener('resize', window.tentaiCtaGate, { passive: true });
    window.tentaiCtaGate(); // deep links / scroll restoration land mid-page
})();

// Smooth scroll with offset for fixed header. Bare "#" links are panel
// openers (data-open-frontdesk) handled by frontdesk-panel.js — skip them.
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
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

// Randomized title reveals — every visit deals a fresh motion to each title.
// Titles only; blocks hold still. The pool shares one easing/duration voice so
// the variety reads as alive, not glitchy. Skipped entirely under reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const TITLE_SEL = '.section-badge, .section-title, .pause-line, .about-badge, .about-title, ' +
                      '.project-card h3, .feature-card h3, .founder-info h3';
    const titles = [...document.querySelectorAll(TITLE_SEL)]
        .filter(el => !el.closest('.hero') && !el.closest('.footer'));

    // T11/T12 rebuild the title's text into spans — only safe on markup-free titles
    const POOL = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10',
                  'T11:words', 'T12:chars', 'T13', 'T14', 'T15', 'T16'];
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const splitInto = (el, mode) => {
        const text = el.textContent;
        if (mode === 'words') {
            let wi = 0;
            el.innerHTML = text.trim().split(/\s+/)
                .map(w => `<span class="mv-w" style="--wi:${wi++}">${esc(w)}</span>`).join(' ');
        } else {
            let ci = 0;
            el.innerHTML = [...text]
                .map(ch => /\s/.test(ch) ? ch : `<span class="mv-c" style="--ci:${ci++}">${esc(ch)}</span>`).join('');
        }
    };
    const shuffled = () => {
        const a = POOL.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // shuffle-bag deal: even coverage of the pool, no treatment hogging the page
    let bag = [];
    titles.forEach(el => {
        let t = null;
        for (let tries = 0; tries < 40 && !t; tries++) {
            if (!bag.length) bag = shuffled();
            const cand = bag.pop();
            const split = cand.split(':')[1];
            if (split && (el.children.length || (split === 'chars' && el.textContent.trim().length > 26))) continue;
            t = cand;
        }
        const [code, split] = (t || 'T01').split(':');
        el.dataset.t = code;
        if (split) splitInto(el, split);
    });
    document.body.classList.add('motion-rand');

    const revealIfSeen = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (!vh) return;
        titles.forEach(el => {
            if (el.classList.contains('in')) return;
            const r = el.getBoundingClientRect();
            if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
        });
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    titles.forEach(el => observer.observe(el));
    setTimeout(revealIfSeen, 80);
    let revealTick = null;
    window.addEventListener('scroll', () => {
        if (revealTick) return;
        revealTick = setTimeout(() => { revealTick = null; revealIfSeen(); }, 120);
    }, { passive: true });
}

// One scroll handler: nav tighten + scroll-indicator fade + CTA band gate
const navEl = document.querySelector('.navbar');
const scrollIndicatorEl = document.querySelector('.scroll-indicator');
window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    if (navEl) navEl.classList.toggle('scrolled', y > 40);
    if (scrollIndicatorEl) scrollIndicatorEl.style.opacity = y > 100 ? '0' : '1';
    if (window.tentaiCtaGate) window.tentaiCtaGate();
}, { passive: true });

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

console.log('%cTentai Technology', 'font-family: Georgia, serif; color: #D4B876; font-size: 18px;');
console.log('%ctentaitech.com \u00b7 Vi \u00b7 client services \u00b7 v1.0.0', 'font-family: monospace; color: #B8963F; font-size: 11px; letter-spacing: 1px;');
