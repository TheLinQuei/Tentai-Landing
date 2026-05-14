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
// Sol Calendar engine + widget.
//
// Tentai's invented 13-month calendar:
//  - Sol Year N = Gregorian Year N (both start Jan 1, both end Dec 31).
//  - Sol Day 1 = Gregorian Jan 1, named "April 1" in Sol Calendar.
//  - 13 months × 28 days = 364 days, in order:
//      April, May, June, July, August, Sol, September, October,
//      November, December, January, February, March
//  - Sol Day 365 = "Still Day" (Gregorian Dec 31 non-leap / Dec 30 leap).
//  - Sol Day 366 = "Leap Still Day" (Gregorian Dec 31, leap years only).
//  - Internal weekday: Sol Day 1 = Monday. The 7-day cycle is internal to
//    Sol — 364 days = 52 weeks exactly, and Still Day(s) are intercalary
//    (no weekday), so every Sol year starts on Monday again. Every Sol
//    month is identical: 4 rows × 7 columns, Monday-first.
// ─────────────────────────────────────────────────────────────────────────
const SolEngine = (function () {
  const MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'Sol',
    'September', 'October', 'November', 'December',
    'January', 'February', 'March',
  ];

  const WEEKDAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEKDAY_NAMES_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);

  // Day-of-year (1-indexed): Jan 1 = 1, Dec 31 = 365 or 366.
  const dayOfYear = (d) => {
    const start = Date.UTC(d.getFullYear(), 0, 1);
    const cur = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((cur - start) / 86400000) + 1;
  };

  // Gregorian Date → Sol date { year, dayInYear, monthIndex?, monthName?, day?, special?, weekday? }.
  const fromGregorian = (gDate) => {
    const year = gDate.getFullYear();
    const dayInYear = dayOfYear(gDate);
    if (dayInYear <= 364) {
      const monthIndex = Math.floor((dayInYear - 1) / 28);
      const day = ((dayInYear - 1) % 28) + 1;
      return {
        year,
        dayInYear,
        monthIndex,
        monthName: MONTHS[monthIndex],
        day,
        weekday: (dayInYear - 1) % 7,
      };
    }
    if (dayInYear === 365) return { year, dayInYear, special: 'Still Day' };
    return { year, dayInYear, special: 'Leap Still Day' };
  };

  // Sol date (year + dayInYear) → Gregorian Date.
  const toGregorian = (year, dayInYear) => new Date(year, 0, dayInYear);

  // Build the 28-day grid for a given Sol month (year + monthIndex).
  // Returns an array of 28 { day, gregorian, weekday, isToday }.
  const buildMonth = (year, monthIndex) => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const firstDayInYear = monthIndex * 28 + 1;
    const days = [];
    for (let i = 0; i < 28; i++) {
      const dayInYear = firstDayInYear + i;
      const greg = toGregorian(year, dayInYear);
      days.push({
        day: i + 1,
        gregorian: greg,
        weekday: i % 7, // Mon=0 since Sol Day 1 = Mon and months always start on Mon
        isToday: greg.toISOString().slice(0, 10) === todayISO,
      });
    }
    return days;
  };

  // Build the still-day appendix for a year — 1 or 2 days outside any month.
  const buildAppendix = (year) => {
    const days = [{ dayInYear: 365, gregorian: toGregorian(year, 365), label: 'Still Day' }];
    if (isLeap(year)) {
      days.push({ dayInYear: 366, gregorian: toGregorian(year, 366), label: 'Leap Still Day' });
    }
    return days;
  };

  const fmtGreg = (d) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const fmtSol = (sol) => {
    if (sol.special) return `${sol.special} · Sol Year ${sol.year}`;
    return `${sol.monthName} ${sol.day}, Sol Year ${sol.year}`;
  };

  const fmtSolWithWeekday = (sol) => {
    if (sol.special) return fmtSol(sol);
    return `${WEEKDAY_NAMES_LONG[sol.weekday]}, ${sol.monthName} ${sol.day}, Sol Year ${sol.year}`;
  };

  return { MONTHS, WEEKDAY_NAMES_SHORT, isLeap, fromGregorian, toGregorian, buildMonth, buildAppendix, fmtGreg, fmtSol, fmtSolWithWeekday };
})();

(function solCalendarWidget() {
  const widget = document.getElementById('solCalendarWidget');
  if (!widget) return;

  const titleEl = document.getElementById('solCalTitle');
  const subtitleEl = document.getElementById('solCalSubtitle');
  const gridEl = document.getElementById('solCalGrid');
  const prevBtn = document.getElementById('solPrev');
  const nextBtn = document.getElementById('solNext');

  // Replace existing weekday headers (which were Sun-first) with Mon-first.
  const replaceHeaders = () => {
    while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);
    SolEngine.WEEKDAY_NAMES_SHORT.forEach(name => {
      const h = document.createElement('div');
      h.className = 'calendar-day header';
      h.textContent = name;
      gridEl.appendChild(h);
    });
  };
  replaceHeaders();

  // Append a day cell to the grid.
  const renderMonth = (year, monthIndex) => {
    replaceHeaders();
    const days = SolEngine.buildMonth(year, monthIndex);
    titleEl.textContent = `${SolEngine.MONTHS[monthIndex]} · Sol Year ${year}`;
    subtitleEl.textContent = `${SolEngine.fmtGreg(days[0].gregorian)} – ${SolEngine.fmtGreg(days[27].gregorian)}`;
    days.forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'calendar-day' + (d.isToday ? ' today' : '');
      cell.textContent = d.day.toString();
      cell.title = `${SolEngine.MONTHS[monthIndex]} ${d.day}, Sol Year ${year} = ${SolEngine.fmtGreg(d.gregorian)}`;
      gridEl.appendChild(cell);
    });
  };

  const renderAppendix = (year) => {
    replaceHeaders();
    const days = SolEngine.buildAppendix(year);
    titleEl.textContent = `${days.length > 1 ? 'Still Days' : 'Still Day'} · Sol Year ${year}`;
    subtitleEl.textContent = days.map(d => SolEngine.fmtGreg(d.gregorian)).join(' & ');
    const todayISO = new Date().toISOString().slice(0, 10);
    // Pad to center: 3 blanks before, then days, then blanks
    const totalCols = 7;
    const blanksBefore = Math.floor((totalCols - days.length) / 2);
    for (let i = 0; i < blanksBefore; i++) {
      const b = document.createElement('div');
      b.className = 'calendar-day';
      b.style.visibility = 'hidden';
      gridEl.appendChild(b);
    }
    days.forEach(d => {
      const cell = document.createElement('div');
      const isToday = d.gregorian.toISOString().slice(0, 10) === todayISO;
      cell.className = 'calendar-day' + (isToday ? ' today' : '');
      cell.textContent = d.dayInYear === 365 ? '★' : '✦';
      cell.title = `${d.label}, Sol Year ${year} = ${SolEngine.fmtGreg(d.gregorian)}`;
      cell.style.fontWeight = '600';
      gridEl.appendChild(cell);
    });
  };

  // State: start at the month containing today.
  const today = SolEngine.fromGregorian(new Date());
  let current = today.special
    ? { kind: 'appendix', year: today.year }
    : { kind: 'month', year: today.year, monthIndex: today.monthIndex };

  const render = () => {
    if (current.kind === 'appendix') renderAppendix(current.year);
    else renderMonth(current.year, current.monthIndex);
  };

  const navigate = (delta) => {
    if (current.kind === 'month') {
      let m = current.monthIndex + delta;
      let y = current.year;
      if (m > 12) { current = { kind: 'appendix', year: y }; }
      else if (m < 0) { current = { kind: 'appendix', year: y - 1 }; }
      else { current = { kind: 'month', year: y, monthIndex: m }; }
    } else {
      // appendix → next year's April, or previous year's March
      if (delta > 0) current = { kind: 'month', year: current.year + 1, monthIndex: 0 };
      else current = { kind: 'month', year: current.year, monthIndex: 12 };
    }
    render();
  };

  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));
  render();
})();

// ─────────────────────────────────────────────────────────────────────────
// Sol Calendar Gregorian → Sol lookup widget.
//
// Type or pick any Gregorian date, see what it becomes in Sol Calendar.
// Live conversion as the user types.
// ─────────────────────────────────────────────────────────────────────────
(function solLookupWidget() {
  const input = document.getElementById('solLookupInput');
  const result = document.getElementById('solLookupResult');
  if (!input || !result) return;

  const update = () => {
    if (!input.value) {
      result.textContent = '';
      return;
    }
    const [y, m, d] = input.value.split('-').map(Number);
    if (!y || !m || !d) {
      result.textContent = '';
      return;
    }
    const greg = new Date(y, m - 1, d);
    if (Number.isNaN(greg.getTime())) {
      result.textContent = '';
      return;
    }
    const sol = SolEngine.fromGregorian(greg);
    result.innerHTML =
      `<div class="sol-lookup-result-main">${SolEngine.fmtSolWithWeekday(sol)}</div>` +
      `<div class="sol-lookup-result-sub">${SolEngine.fmtGreg(greg)} in the Gregorian calendar</div>`;
  };

  // Default to today's date.
  const todayISO = new Date().toISOString().slice(0, 10);
  if (!input.value) input.value = todayISO;
  input.addEventListener('input', update);
  input.addEventListener('change', update);
  update();
})();

console.log('%c✨ Sol Calendar Landing Page', 'color: #6c5ce7; font-size: 20px; font-weight: bold;');
console.log('%cMade with ❤️ by Tentai Technology', 'color: #E7C26A; font-size: 14px;');
console.log('%cThis is just the beginning...', 'color: #A88CFF; font-size: 12px; font-style: italic;');
