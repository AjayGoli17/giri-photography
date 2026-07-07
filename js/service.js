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

   HARDENED VERSION — fixes a bug where the hero heading (and
   any other .reveal element) could stay permanently invisible
   in production. The CSS hides .reveal elements until a
   .is-visible class is added, and that class was ONLY ever
   added by an IntersectionObserver callback. If the observer
   never fired for some reason (element already in view at
   load in an edge case, a slow/blocked script elsewhere, an
   unusual production timing issue, etc.) the element had no
   way to recover and stayed blank forever.

   Fixes applied below:
     A. On load, elements already inside the viewport are
        revealed immediately instead of waiting on the observer.
     B. A hard failsafe timer forces every reveal element visible
        after 2.5s no matter what, so nothing can get stuck.
     C. Every independent feature (reveal, parallax, logo, page
        transitions, header compact, tilt/spotlight, ripple) is
        wrapped in its own try/catch so a failure in one can
        never block the others from running.
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
    try {
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
          // If the fetch fails (e.g. opened as a local file:// page,
          // or data/services.json 404s), the hardcoded prices already
          // in the HTML stay as a fallback.
        });
    } catch (err) {
      console.warn('[service.js] pricing fetch skipped:', err);
    }

    /* ---------------------------------------------------------
       1 + 9. SCROLL REVEAL (every section) + STAGGER + TWO-STAGE
       Every meaningful block on the page gets a `.reveal` class
       added at runtime (so content stays visible if JS is off),
       then fades/slides up into `.is-visible` when scrolled into
       view. Cards within the same row get an incremental
       `--i` custom property so they cascade in with a stagger.
       The price/CTA footer inside each card reveals a beat later
       via a CSS transition-delay (see service.css).

       HARDENED: elements already in view at load are revealed
       immediately (no waiting on the observer's first tick), and
       a failsafe timeout guarantees everything is visible within
       2.5s even in the worst case.
       --------------------------------------------------------- */
    try {
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

        /* --- A. Reveal anything already in the viewport right away --- */
        const isInInitialView = (el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.top < window.innerHeight * 0.95 &&
            rect.bottom > 0
          );
        };
        revealEls.forEach((el) => {
          if (isInInitialView(el)) {
            el.classList.add('is-visible');
          }
        });

        let observer = null;
        if ('IntersectionObserver' in window) {
          try {
            observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                  }
                });
              },
              { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
            );

            revealEls.forEach((el) => {
              if (!el.classList.contains('is-visible')) observer.observe(el);
            });
          } catch (obsErr) {
            console.warn('[service.js] IntersectionObserver setup failed, revealing all:', obsErr);
            revealEls.forEach((el) => el.classList.add('is-visible'));
          }
        } else {
          /* No IntersectionObserver support — just show everything */
          revealEls.forEach((el) => el.classList.add('is-visible'));
        }

        /* --- B. Failsafe: whatever hasn't revealed yet, force it after 2.5s.
           This is the safety net — content can never stay permanently
           hidden even if the observer silently fails to fire. --- */
        window.setTimeout(() => {
          revealEls.forEach((el) => {
            if (!el.classList.contains('is-visible')) {
              el.classList.add('is-visible');
            }
          });
          if (observer) {
            try { observer.disconnect(); } catch (e) { /* no-op */ }
          }
        }, 2500);
      }
    } catch (err) {
      console.warn('[service.js] reveal system failed, showing content plainly:', err);
      /* Last-resort: if the whole reveal block blew up for any reason,
         strip any partially-applied hiding classes so content is never
         left invisible. */
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------------------------------------------------------
       4. PARALLAX DRIFT for the oversized background words
       ("weddings", "personal") — moves slightly against scroll
       to add a bit of depth. Skipped entirely for reduced motion.
       --------------------------------------------------------- */
    try {
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
    } catch (err) {
      console.warn('[service.js] parallax skipped:', err);
    }

    /* ---------------------------------------------------------
       10 (logo). LOGO LOAD-IN
       One-time fade + scale for the header logo on first paint —
       not scroll-triggered, just a soft entrance once the page
       (and the logo image itself) is ready.
       --------------------------------------------------------- */
    try {
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
    } catch (err) {
      console.warn('[service.js] logo load-in skipped:', err);
      const logoMark = document.querySelector('.logo-mark');
      if (logoMark) logoMark.classList.add('logo-in');
    }

    /* ---------------------------------------------------------
       13. PAGE-TRANSITION FADE for internal links
       Fades the page in on load, and fades out before navigating
       to another local page in this site (external links, mailto,
       anchors, and new-tab links are left untouched).
       --------------------------------------------------------- */
    try {
      document.body.classList.add('page-fade');

      window.addEventListener('load', () => {
        requestAnimationFrame(() => document.body.classList.add('page-loaded'));
      });

      /* Failsafe: if 'load' somehow never fires the fade-in class
         (blocked resource, etc.), don't leave the whole page at
         opacity:0 forever. */
      window.setTimeout(() => {
        document.body.classList.add('page-loaded');
      }, 2500);
    } catch (err) {
      console.warn('[service.js] page-fade skipped:', err);
      document.body.classList.add('page-loaded');
    }

    /* ---------------------------------------------------------
       19. HEADER COMPACT-ON-SCROLL
       Adds a class once the user has scrolled past a small
       threshold so the header can shrink slightly via CSS.
       --------------------------------------------------------- */
    try {
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
    } catch (err) {
      console.warn('[service.js] header compact-on-scroll skipped:', err);
    }

    if (!prefersReducedMotion) {
      /* -------------------------------------------------------
         20 + 21. CURSOR-SPOTLIGHT GLOW + SUBTLE 3D IMAGE TILT
         On pointer move over a card, set CSS custom properties
         for the spotlight position (--mx/--my) and a gentle
         tilt on the image inside (--tiltX/--tiltY). Resets on
         pointer leave.
         ------------------------------------------------------- */
      try {
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
      } catch (err) {
        console.warn('[service.js] cursor spotlight/tilt skipped:', err);
      }

      /* -------------------------------------------------------
         22. RIPPLE EFFECT ON BUTTON CLICKS
         Spawns a short-lived expanding circle from the click
         point on Book Now / CTA buttons, then removes itself.
         ------------------------------------------------------- */
      try {
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
      } catch (err) {
        console.warn('[service.js] ripple effect skipped:', err);
      }
    }

    try {
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
    } catch (err) {
      console.warn('[service.js] page-transition links skipped:', err);
      document.body.classList.add('page-loaded');
    }
  })();