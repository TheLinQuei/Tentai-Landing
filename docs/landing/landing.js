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
        showNotification(`Downloading Sol Calendar for ${platform}...`);
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

// ─────────────────────────────────────────────────────────────────────────
// Sol Calendar widget — live, navigable.
//
// Sol Calendar is Tentai's invented 13-month system: 12 months of 28 days
// + 1 "Still Day" (or "Leap Still Day" in leap years) = 365/366 total.
// Anchored to the winter solstice (Dec 21 by default = Sol day 319).
// Algorithm cribbed from TheLinQuei/sol-calendar/src/calendar.js so the
// widget stays in sync with the canonical product.
// ─────────────────────────────────────────────────────────────────────────
(function solCalendarWidget() {
  const widget = document.getElementById('solCalendarWidget');
  if (!widget) return;

  const MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'Sol',
    'September', 'October', 'November', 'December',
    'January', 'February', 'March',
  ];

  const titleEl = document.getElementById('solCalTitle');
  const subtitleEl = document.getElementById('solCalSubtitle');
  const gridEl = document.getElementById('solCalGrid');
  const prevBtn = document.getElementById('solPrev');
  const nextBtn = document.getElementById('solNext');

  const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);

  const daysBetween = (a, b) => {
    const ms = 86400000;
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / ms);
  };

  // Default winter-solstice anchor: Dec 21, Sol day 319.
  const WINTER_SOLSTICE_DAY = 319;
  const winterSolsticeForYear = (y) => new Date(y, 11, 21, 0, 0, 0, 0);

  // Convert a Gregorian Date → Sol day number (1..365/366).
  const dayNoFromGregorian = (gDate) => {
    const y = gDate.getFullYear();
    const wsThis = winterSolsticeForYear(y);
    const wsPrev = winterSolsticeForYear(y - 1);
    const anchor = gDate >= wsThis ? wsThis : wsPrev;
    const anchorYear = anchor.getFullYear();
    const len = isLeapYear(anchorYear) ? 366 : 365;
    const daysAfter = daysBetween(anchor, gDate);
    let solDay = WINTER_SOLSTICE_DAY + daysAfter;
    solDay = ((solDay - 1) % len + len) % len + 1;
    return { solDay, anchorYear, yearLen: len };
  };

  // Convert Sol day number → { monthIndex, day, special? }.
  const monthDayFromDayNo = (dayNo, yearLen) => {
    if (dayNo === 365 && yearLen === 365) return { special: 'Still Day' };
    if (dayNo === 366 && yearLen === 366) return { special: 'Leap Still Day' };
    if (dayNo === 365 && yearLen === 366) return { special: 'Still Day' };
    const idx = Math.floor((dayNo - 1) / 28);
    const day = ((dayNo - 1) % 28) + 1;
    return { monthIndex: idx, day, monthName: MONTHS[idx] };
  };

  // Find the Gregorian Date for a given Sol day in a given anchor-year cycle.
  // Walks forward/back from a reference date until the solDay matches.
  const gregorianForSolDay = (targetSolDay, nearDate) => {
    const base = new Date(nearDate.getFullYear(), nearDate.getMonth(), nearDate.getDate());
    for (let r = 0; r <= 400; r++) {
      const offset = r === 0 ? 0 : (r % 2 === 0 ? r / 2 : -((r + 1) / 2));
      const test = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
      const { solDay } = dayNoFromGregorian(test);
      if (solDay === targetSolDay) return test;
    }
    return null;
  };

  // Format Gregorian date as "Dec 21, 2026".
  const fmtGreg = (d) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Render the calendar for a given Sol month index (0–12).
  // anchorYear is the Gregorian year of the winter solstice that started this Sol year.
  const render = (monthIndex, anchorYear) => {
    // Clear existing day cells, keep weekday headers (first 7 children).
    while (gridEl.children.length > 7) gridEl.removeChild(gridEl.lastChild);

    if (monthIndex === 13) {
      // Still Day(s) view — 1 or 2 days outside the 28-day grid.
      const stillDayNos = isLeapYear(anchorYear) ? [365, 366] : [365];
      const refDate = winterSolsticeForYear(anchorYear);
      const days = stillDayNos.map(n => ({ dayNo: n, gDate: gregorianForSolDay(n, refDate) }));
      titleEl.textContent = `Still Day${days.length > 1 ? 's' : ''} · ${anchorYear}`;
      subtitleEl.textContent = days.map(d => fmtGreg(d.gDate)).join(' & ');
      // Spacer to align with grid
      for (let i = 0; i < 7; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day';
        blank.style.visibility = 'hidden';
        gridEl.appendChild(blank);
      }
      days.forEach((d, idx) => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.style.gridColumn = (3 + idx).toString(); // center-ish
        cell.style.fontWeight = '600';
        cell.style.color = 'var(--accent, #A88CFF)';
        cell.textContent = stillDayNos[idx] === 365 ? '★' : '✦';
        cell.title = monthDayFromDayNo(d.dayNo, isLeapYear(anchorYear) ? 366 : 365).special;
        gridEl.appendChild(cell);
      });
      return;
    }

    // Regular Sol month (always 28 days).
    const monthName = MONTHS[monthIndex];
    // First day of this Sol month: solDay = monthIndex * 28 + 1
    const firstSolDay = monthIndex * 28 + 1;
    const refDate = winterSolsticeForYear(anchorYear);
    const firstGregDate = gregorianForSolDay(firstSolDay, refDate);
    const lastGregDate = new Date(firstGregDate);
    lastGregDate.setDate(lastGregDate.getDate() + 27);

    titleEl.textContent = `${monthName} · ${anchorYear}`;
    subtitleEl.textContent = `${fmtGreg(firstGregDate)} – ${fmtGreg(lastGregDate)}`;

    // Layout: 28 days laid out by weekday (firstGregDate's weekday = column offset).
    const firstWeekday = firstGregDate.getDay(); // 0=Sun
    for (let i = 0; i < firstWeekday; i++) {
      const blank = document.createElement('div');
      blank.className = 'calendar-day';
      blank.style.visibility = 'hidden';
      gridEl.appendChild(blank);
    }

    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    for (let i = 0; i < 28; i++) {
      const gDate = new Date(firstGregDate);
      gDate.setDate(gDate.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.textContent = (i + 1).toString();
      cell.title = fmtGreg(gDate);
      if (gDate.toISOString().slice(0, 10) === todayISO) {
        cell.classList.add('today');
      }
      gridEl.appendChild(cell);
    }
  };

  // State: which Sol month + anchor-year cycle we're showing.
  // Start at today.
  const now = new Date();
  const { solDay: todaySolDay, anchorYear: todayAnchorYear, yearLen: todayYearLen } = dayNoFromGregorian(now);
  const todayInfo = monthDayFromDayNo(todaySolDay, todayYearLen);
  let current = {
    monthIndex: todayInfo.special ? 13 : todayInfo.monthIndex,
    anchorYear: todayAnchorYear,
  };

  const navigate = (delta) => {
    let m = current.monthIndex + delta;
    let y = current.anchorYear;
    // Months 0..12 are normal Sol months; 13 = Still Day(s) appendix.
    if (m > 13) { m = 0; y += 1; }
    if (m < 0)  { m = 13; y -= 1; }
    current = { monthIndex: m, anchorYear: y };
    render(current.monthIndex, current.anchorYear);
  };

  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

  render(current.monthIndex, current.anchorYear);
})();

console.log('%c✨ Sol Calendar Landing Page', 'color: #6c5ce7; font-size: 20px; font-weight: bold;');
console.log('%cMade with ❤️ by Tentai Technology', 'color: #E7C26A; font-size: 14px;');
console.log('%cThis is just the beginning...', 'color: #A88CFF; font-size: 12px; font-style: italic;');
