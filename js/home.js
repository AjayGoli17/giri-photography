// ==========================================================================
// Giri Photography — Homepage interactions
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Homepage services preview: image/name/price are managed by ---------- */
  /* the client through /admin (Homepage Services Preview section), which edits    */
  /* data/home-services.json. Fetch that file and drop each card's info into the   */
  /* matching #home-service-photo-N / -name-N / -price-N elements. If the fetch    */
  /* fails, the hardcoded values already in index.html stay as a fallback.         */
  try {
    fetch('data/home-services.json')
      .then((res) => res.json())
      .then((data) => {
        (data.cards || []).forEach((card) => {
          const photoEl = document.getElementById('home-service-photo-' + card.id);
          const nameEl = document.getElementById('home-service-name-' + card.id);
          const priceEl = document.getElementById('home-service-price-' + card.id);
          if (photoEl && card.photo) {
            photoEl.src = card.photo;
            photoEl.alt = card.name || photoEl.alt;
          }
          if (nameEl && card.name) nameEl.textContent = card.name;
          if (priceEl && card.price) priceEl.textContent = card.price;
        });
      })
      .catch(() => {
        // data/home-services.json missing or unreachable — keep hardcoded values.
      });
  } catch (err) {
    console.warn('[home.js] services preview fetch skipped:', err);
  }

  /* ---------- Preloader: show "Giri Photography" + a progress bar while ---------- */
  /* the page loads, then fade it out and reveal the rest of the page.            */
  const preloader = document.getElementById('preloader');
  const preloaderText = preloader ? preloader.querySelector('.preloader-text') : null;
  const preloaderProgress = preloader ? preloader.querySelector('.preloader-progress') : null;
  const progressBar = document.getElementById('preloaderProgressBar');

  function revealPage() {
    document.documentElement.classList.remove('is-loading');
    document.body.classList.add('page-ready');
  }

  function fadeOutTextAndProgress() {
    [preloaderText, preloaderProgress].forEach(el => {
      if (!el) return;
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
    });
  }

  function hidePreloader() {
    if (!preloader) {
      revealPage();
      return;
    }
    fadeOutTextAndProgress();
    setTimeout(() => {
      revealPage();
      preloader.classList.add('loaded');
      setTimeout(() => preloader.remove(), 550);
    }, 300);
  }

  if (preloader) {
    let resolved = false;
    const safeHide = () => {
      if (resolved) return;
      resolved = true;
      if (progressBar) {
        progressBar.style.transition = 'width .25s ease';
        progressBar.style.width = '100%';
      }
      setTimeout(() => {
        try {
          hidePreloader();
        } catch (err) {
          console.error('Preloader animation failed, revealing page:', err);
          revealPage();
          preloader.remove();
        }
      }, progressBar ? 200 : 0);
    };

    // Indeterminate creep toward ~85% while we wait for real load signals,
    // so the bar always feels like it's making progress rather than stalling.
    if (progressBar && !prefersReducedMotion) {
      requestAnimationFrame(() => {
        progressBar.style.transition = 'width 1.1s cubic-bezier(.16,1,.3,1)';
        progressBar.style.width = '82%';
      });
    } else if (progressBar) {
      progressBar.style.width = '100%';
    }

    const pageLoaded = new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    const minWait = new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 150 : 900));

    Promise.all([pageLoaded, minWait]).then(safeHide);
    // Hard ceiling: never let the preloader block the page for more than 4s.
    setTimeout(safeHide, 4000);
  } else {
    revealPage();
  }

  /* ---------- Header shrink-on-scroll ---------- */
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    const SHRINK_AT = 100;
    const onHeaderScroll = () => {
      siteHeader.classList.toggle('scrolled', window.scrollY > SHRINK_AT);
    };
    onHeaderScroll();
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
  }

  /* ---------- Mobile nav open/close state sync (stagger relies on .open) ---------- */
  const navToggleBtn = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('navLinks');
  if (navToggleBtn && mobileNav) {
    // Mirror whatever toggles aria-expanded (e.g. main.js) onto an .open
    // class so the CSS stagger animation has something to key off.
    const syncOpenClass = () => {
      const expanded = navToggleBtn.getAttribute('aria-expanded') === 'true';
      mobileNav.classList.toggle('open', expanded);
    };
    syncOpenClass();
    if ('MutationObserver' in window) {
      new MutationObserver(syncOpenClass).observe(navToggleBtn, { attributes: true, attributeFilter: ['aria-expanded'] });
    }
    // Fallback: also toggle directly on click in case nothing else does.
    navToggleBtn.addEventListener('click', () => {
      setTimeout(syncOpenClass, 0);
    });
  }

  /* ---------- Performance: pause infinite animations while off-screen ---------- */
  const heroEl = document.querySelector('.hero');
  if (heroEl && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        heroEl.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { threshold: 0 });
    heroObserver.observe(heroEl);
  } else if (heroEl) {
    heroEl.classList.add('in-view');
  }

  const liveDot = document.querySelector('.live-dot');
  if (liveDot && 'IntersectionObserver' in window) {
    const dotObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        liveDot.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 });
    dotObserver.observe(liveDot);
  }

  /* ---------- Gallery image fade-in once loaded ---------- */
  document.querySelectorAll('.ph img').forEach(img => {
    const markLoaded = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  });

  /* ---------- Services carousel ---------- */
  // Deliberately minimal: plain overflow-x:auto in CSS, plain <img> tags,
  // no custom touch/scroll JS of any kind. Every previous "fix" here (touch
  // hijacking, lazy-load observers, shimmer toggling) added complexity on
  // top of complexity while chasing a stuck-scroll bug. Stripping it back
  // to what the browser already does natively removes every custom moving
  // part that could have been contributing, whatever the actual cause was.
  const serviceCardsContainer = document.querySelector('.service-cards');
  const serviceCardsWrap = document.querySelector('.service-cards-wrap');

  if (serviceCardsWrap && 'IntersectionObserver' in window) {
    const cardsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          serviceCardsWrap.classList.add('cards-in-view');
          cardsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    cardsObserver.observe(serviceCardsWrap);
  } else if (serviceCardsWrap) {
    serviceCardsWrap.classList.add('cards-in-view');
  }

  /* ---------- Services swipe hint ---------- */
  const scrollHint = document.querySelector('.scroll-hint');
  if (serviceCardsContainer && scrollHint) {
    serviceCardsContainer.addEventListener('scroll', () => {
      scrollHint.classList.add('hidden');
    }, { passive: true });
  }

  /* ---------- Quote carousel ---------- */
  const quotes = [
    { text: 'The studio has a unique ability to capture the soul of a garment. Their work isn\u2019t just photography; it\u2019s high art that communicates prestige and quiet luxury.', cite: 'Creative Director, Vogue' },
    { text: 'Every frame felt intentional. It didn\u2019t just document our wedding day, it told the story we\u2019ll want to remember in twenty years.', cite: 'Priya & Arjun, Clients' },
    { text: 'Working with this team on our editorial shoot was effortless. They understood the brief instantly and elevated it further.', cite: 'Art Director, Elle India' }
  ];

  let quoteIndex = 0;
  const quoteEl = document.querySelector('.quote-section blockquote');
  const citeEl = document.querySelector('.quote-section cite');
  const dotsEl = document.querySelector('.quote-section .quote-dots');
  const QUOTE_INTERVAL = 2500; // ms between auto-advances
  const QUOTE_FADE = 350;      // ms fade duration, keep in sync with CSS transition

  if (document.querySelector('.quote-section')) {
    document.querySelector('.quote-section').style.setProperty('--quote-interval', `${QUOTE_INTERVAL}ms`);
  }

  function renderDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = quotes.map((_, i) =>
      `<button type="button" class="quote-dot${i === quoteIndex ? ' active' : ''}" aria-label="Show testimonial ${i + 1} of ${quotes.length}" data-index="${i}" style="--quote-interval:${QUOTE_INTERVAL}ms"></button>`
    ).join('');
  }

  function renderQuote(direction = 1) {
    if (!quoteEl || !citeEl) return;
    const outClass = direction >= 0 ? 'slide-out-left' : 'slide-out-right';
    quoteEl.style.opacity = 0;
    citeEl.style.opacity = 0;
    quoteEl.classList.add(outClass);
    citeEl.classList.add(outClass);
    setTimeout(() => {
      quoteEl.textContent = `\u201C${quotes[quoteIndex].text}\u201D`;
      citeEl.textContent = `\u2014 ${quotes[quoteIndex].cite}`;
      quoteEl.classList.remove('slide-out-left', 'slide-out-right');
      citeEl.classList.remove('slide-out-left', 'slide-out-right');
      quoteEl.classList.add('slide-in');
      citeEl.classList.add('slide-in');
      quoteEl.style.opacity = 1;
      citeEl.style.opacity = 1;
      renderDots();
    }, QUOTE_FADE);
  }

  function advanceQuote() {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    renderQuote(1);
  }

  if (quoteEl && citeEl && quotes.length > 1) {
    renderDots();

    let quoteTimer = setInterval(advanceQuote, QUOTE_INTERVAL);

    function restartQuoteTimer() {
      clearInterval(quoteTimer);
      quoteTimer = setInterval(advanceQuote, QUOTE_INTERVAL);
    }

    if (dotsEl) {
      dotsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.quote-dot');
        if (!btn) return;
        const i = Number(btn.dataset.index);
        if (i === quoteIndex) return;
        const direction = i > quoteIndex ? 1 : -1;
        quoteIndex = i;
        renderQuote(direction);
        restartQuoteTimer();
      });
    }

    // Pause the slow rotation while the user's attention is on the section,
    // resume once they scroll away, so it doesn't fight with reading.
    const quoteSection = document.querySelector('.quote-section');
    if (quoteSection && 'IntersectionObserver' in window) {
      const quoteVisibility = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          clearInterval(quoteTimer);
          if (entry.isIntersecting) {
            quoteTimer = setInterval(advanceQuote, QUOTE_INTERVAL);
          }
        });
      }, { threshold: 0.4 });
      quoteVisibility.observe(quoteSection);
    }
  }

  /* ---------- Smooth-reveal on scroll (section-level) ---------- */
  const revealTargets = document.querySelectorAll('.studio, .quote-section');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach(el => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      observer.observe(el);
    });
  }

  /* ---------- Generic "add .in-view once visible" observer ---------- */
  // Powers: studio split-reveal (heading/paragraph), CTA card scale-in, footer fade-up.
  const inViewTargets = document.querySelectorAll('.split-reveal, .cta-section .container, footer');

  if ('IntersectionObserver' in window && inViewTargets.length) {
    const inViewObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          inViewObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    inViewTargets.forEach(el => inViewObserver.observe(el));
  } else {
    // No IntersectionObserver support: show everything immediately.
    inViewTargets.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Stats: staggered fade-in + count-up ---------- */
  const statEls = document.querySelectorAll('.stat');
  const statsSection = document.querySelector('.stats-section');

  function animateCountUp(numEl) {
    const target = Number(numEl.dataset.target || 0);
    const suffix = numEl.dataset.suffix || '';
    const pad = Number(numEl.dataset.pad || 0);
    const format = (n) => (pad ? String(n).padStart(pad, '0') : String(n)) + suffix;

    if (!target) {
      numEl.textContent = format(target);
      return;
    }

    // Note: count-up intentionally still runs under prefers-reduced-motion.
    // It's a numeric text update, not spatial/parallax motion, so it's kept
    // for all users rather than silently skipped (which looked like the
    // stats "not working" on devices/OS settings with Reduce Motion on).
    const duration = prefersReducedMotion ? 600 : 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(eased * target);
      numEl.textContent = format(value);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (statsSection && statEls.length && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statEls.forEach(stat => {
            stat.classList.add('in-view');
            const numEl = stat.querySelector('.num');
            if (numEl) animateCountUp(numEl);
          });
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    statsObserver.observe(statsSection);
  } else {
    statEls.forEach(stat => {
      stat.classList.add('in-view');
      const numEl = stat.querySelector('.num');
      if (numEl) animateCountUp(numEl);
    });
  }

});