/* =========================================================
   service.js — page-specific behavior for services.html
   Scroll-reveal (staggered), image scale-on-load, parallax
   for the giant background words, and a soft page-transition
   fade for internal links. Nav toggle + header hide/show are
   still handled globally by main.js — this file only adds a
   smoother easing hook for that header transform (see CSS).

   Extended in this pass with: a scroll progress bar, a
   header compact-on-scroll state, cursor-spotlight glow +
   subtle 3D tilt on cards/images, and a click ripple on the
   booking buttons — see the "EXTENDED MOTION LAYER" comment
   block in service.css for the full numbered list (18–27).
   ========================================================= */

   (function () {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  
    /* ---------------------------------------------------------
       0. SERVICE PRICING — prices are managed by the client
       through /admin (Service Pricing section), which edits
       data/services.json. Here we just fetch that file and drop
       each price into the matching #price-<id> element, so the
       HTML never needs to be touched again for a price change.
       --------------------------------------------------------- */
    fetch('data/services.json')
      .then((res) => res.json())
      .then((data) => {
        (data.services || []).forEach((service) => {
          const el = document.getElementById('price-' + service.id);
          if (el) {
            el.textContent = '₹' + Number(service.price).toLocaleString('en-IN');
          }
        });
      })
      .catch(() => {
        // If the fetch fails (e.g. opened as a local file:// page),
        // the hardcoded prices already in the HTML stay as a fallback.
      });

    /* ---------------------------------------------------------
       1 + 9. SCROLL REVEAL (every section) + STAGGER + TWO-STAGE
       Every meaningful block on the page gets a `.reveal` class
       added at runtime (so content stays visible if JS is off),
       then fades/slides up into `.is-visible` when scrolled into
       view. Cards within the same row get an incremental
       `--i` custom property so they cascade in with a stagger.
       The price/CTA footer inside each card reveals a beat later
       via a CSS transition-delay (see service.css).
       --------------------------------------------------------- */
    const revealSelector = [
      '.card',
      '.sangeet-row .text-col',
      '.sangeet-row .img-box',
      '.small-grid > div',
      '.overlay-card',
      '.overlay-tag',
      '.cta-card',
      '.hero .eyebrow',
      '.hero-desc',
      'h1.display',
      '.section-bg-word',
      'footer .footer-grid > div',
      'footer .foot-bottom'
    ].join(', ');
  
    const revealEls = Array.from(document.querySelectorAll(revealSelector));
  
    if (prefersReducedMotion) {
      /* Respect reduced-motion: show everything, animate nothing. */
      revealEls.forEach((el) => el.classList.add('reveal', 'is-visible'));
    } else {
      revealEls.forEach((el) => el.classList.add('reveal'));
  
      /* Stagger: index each reveal element among its direct siblings
         so cards in the same row cascade left-to-right / top-to-bottom. */
      const groups = document.querySelectorAll(
        '.row, .small-grid, .stagger, .sangeet-row'
      );
      groups.forEach((group) => {
        let i = 0;
        Array.from(group.children).forEach((child) => {
          if (child.matches(revealSelector) || child.querySelector(revealSelector)) {
            const target = child.matches(revealSelector)
              ? child
              : child.querySelector(revealSelector);
            target.style.setProperty('--i', i);
            i += 1;
          }
        });
      });
  
      if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );
  
        revealEls.forEach((el) => revealObserver.observe(el));
      } else {
        /* No IntersectionObserver support — just show everything */
        revealEls.forEach((el) => el.classList.add('is-visible'));
      }
    }
  
    /* ---------------------------------------------------------
       4. PARALLAX DRIFT for the oversized background words
       ("weddings", "personal") — moves slightly against scroll
       to add a bit of depth. Skipped entirely for reduced motion.
       --------------------------------------------------------- */
    if (!prefersReducedMotion) {
      const bgWords = document.querySelectorAll('.section-bg-word');
  
      if (bgWords.length) {
        let ticking = false;
  
        const updateParallax = () => {
          const viewportH = window.innerHeight;
  
          bgWords.forEach((word) => {
            const rect = word.getBoundingClientRect();
            const centerDelta = rect.top + rect.height / 2 - viewportH / 2;
            const offset = centerDelta * 0.08; /* subtle drift factor */
            word.style.transform = `translateY(${offset}px)`;
          });
  
          ticking = false;
        };
  
        window.addEventListener(
          'scroll',
          () => {
            if (!ticking) {
              requestAnimationFrame(updateParallax);
              ticking = true;
            }
          },
          { passive: true }
        );
  
        updateParallax();
      }
    }
  
    /* ---------------------------------------------------------
       10 (logo). LOGO LOAD-IN
       One-time fade + scale for the header logo on first paint —
       not scroll-triggered, just a soft entrance once the page
       (and the logo image itself) is ready.
       --------------------------------------------------------- */
    const logoMark = document.querySelector('.logo-mark');
    if (logoMark && !prefersReducedMotion) {
      logoMark.classList.add('logo-pending');
      const logoImg = logoMark.querySelector('img');
      const revealLogo = () =>
        requestAnimationFrame(() => logoMark.classList.add('logo-in'));
  
      if (logoImg && logoImg.complete) {
        revealLogo();
      } else if (logoImg) {
        logoImg.addEventListener('load', revealLogo, { once: true });
        logoImg.addEventListener('error', revealLogo, { once: true });
      } else {
        revealLogo();
      }
    }
  
    /* ---------------------------------------------------------
       13. PAGE-TRANSITION FADE for internal links
       Fades the page in on load, and fades out before navigating
       to another local page in this site (external links, mailto,
       anchors, and new-tab links are left untouched).
       --------------------------------------------------------- */
    document.body.classList.add('page-fade');
  
    window.addEventListener('load', () => {
      requestAnimationFrame(() => document.body.classList.add('page-loaded'));
    });
  
    /* ---------------------------------------------------------
       19. HEADER COMPACT-ON-SCROLL
       Adds a class once the user has scrolled past a small
       threshold so the header can shrink slightly via CSS.
       --------------------------------------------------------- */
    const headerEl = document.querySelector('header');
    const updateHeaderCompact = () => {
      if (!headerEl) return;
      if (window.scrollY > 60) {
        headerEl.classList.add('header-compact');
      } else {
        headerEl.classList.remove('header-compact');
      }
    };

    let scrollTicking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            updateHeaderCompact();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      },
      { passive: true }
    );
    updateHeaderCompact();

    if (!prefersReducedMotion) {
      /* -------------------------------------------------------
         20 + 21. CURSOR-SPOTLIGHT GLOW + SUBTLE 3D IMAGE TILT
         On pointer move over a card, set CSS custom properties
         for the spotlight position (--mx/--my) and a gentle
         tilt on the image inside (--tiltX/--tiltY). Resets on
         pointer leave.
         ------------------------------------------------------- */
      const tiltTargets = document.querySelectorAll('.card, .small-grid > div');
      tiltTargets.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          el.style.setProperty('--mx', `${x}px`);
          el.style.setProperty('--my', `${y}px`);

          const img = el.querySelector('.img-box img');
          if (img) {
            const px = (x / rect.width - 0.5) * 2; /* -1 to 1 */
            const py = (y / rect.height - 0.5) * 2;
            img.style.setProperty('--tiltY', `${px * 4}deg`);
            img.style.setProperty('--tiltX', `${-py * 4}deg`);
          }
        });
        el.addEventListener('mouseleave', () => {
          const img = el.querySelector('.img-box img');
          if (img) {
            img.style.setProperty('--tiltX', '0deg');
            img.style.setProperty('--tiltY', '0deg');
          }
        });
      });

      /* -------------------------------------------------------
         22. RIPPLE EFFECT ON BUTTON CLICKS
         Spawns a short-lived expanding circle from the click
         point on Book Now / CTA buttons, then removes itself.
         ------------------------------------------------------- */
      document.querySelectorAll('.book-now, .cta-buttons a').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const rect = btn.getBoundingClientRect();
          const ripple = document.createElement('span');
          const size = Math.max(rect.width, rect.height);
          ripple.className = 'ripple';
          ripple.style.width = ripple.style.height = `${size}px`;
          ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
          ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
          btn.appendChild(ripple);
          ripple.addEventListener(
            'animationend',
            () => ripple.remove(),
            { once: true }
          );
        });
      });
    }

    if (!prefersReducedMotion) {
      document.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        const isInternalPage =
          href &&
          !href.startsWith('#') &&
          !href.startsWith('mailto:') &&
          !href.startsWith('tel:') &&
          !href.startsWith('http') &&
          link.target !== '_blank';
  
        if (isInternalPage) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-leaving');
            window.setTimeout(() => {
              window.location.href = href;
            }, 380);
          });
        }
      });
    } else {
      document.body.classList.add('page-loaded');
    }
  })();