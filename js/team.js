/* ==========================================================================
   Team Page — animation behaviors
   Pairs with the animation system defined in team.css. Every effect here
   respects prefers-reduced-motion by checking the same media query CSS
   already handles for transitions/animations — JS-driven effects (tilt,
   cursor, IntersectionObserver reveals) additionally bail out below.
   ========================================================================== */

   (function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ----------------------------------------------------------------------
       #2 Word-split hero title
       Splits the <h1> text into individual <span class="word"> elements so
       team.css can stagger + blur-reveal each word independently.
       ---------------------------------------------------------------------- */
    function splitHeroTitle() {
        var h1 = document.querySelector(".hero h1");
        if (!h1 || reduceMotion) return;

        var words = h1.textContent.trim().split(/\s+/);
        h1.innerHTML = words
            .map(function (word, i) {
                var delay = 0.25 + i * 0.08;
                return (
                    '<span class="word" style="animation-delay:' +
                    delay +
                    's">' +
                    word +
                    "</span>"
                );
            })
            .join(" ");
    }

    /* ----------------------------------------------------------------------
       #1 Hero entrance
       Adds the .hero-animate class so the CSS keyframe/stagger rules fire.
       Runs after splitHeroTitle so the h1 itself doesn't double-animate
       (its words animate individually instead).
       ---------------------------------------------------------------------- */
    function initHeroEntrance() {
        var subtitle = document.querySelector(".hero .subtitle");
        var h1 = document.querySelector(".hero h1");
        var p = document.querySelector(".hero p");
        var btn = document.querySelector(".hero .btn");

        [subtitle, p, btn].forEach(function (el) {
            if (el) el.classList.add("hero-animate");
        });
        // h1 itself doesn't need hero-animate since its words animate,
        // but if reduced motion is on, just show everything immediately.
        if (reduceMotion && h1) h1.style.opacity = 1;
    }

    /* ----------------------------------------------------------------------
       #3 Subtle parallax on hero content while scrolling
       ---------------------------------------------------------------------- */
    function initParallax() {
        if (reduceMotion) return;
        var hero = document.querySelector(".hero");
        if (!hero) return;

        var ticking = false;
        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var offset = window.scrollY;
                if (offset < window.innerHeight) {
                    hero.style.transform = "translateY(" + offset * 0.15 + "px)";
                }
                ticking = false;
            });
        });
    }

    /* ----------------------------------------------------------------------
       #4 / #5 / #6 / #14 Generic scroll-reveal via IntersectionObserver
       Adds .in-view to any matching element once it enters the viewport.
       Powers: heart-text wipe, heart-title underline draw, member card
       entrance (staggered), and CTA section entrance.
       ---------------------------------------------------------------------- */
    function initScrollReveal() {
        var targets = document.querySelectorAll(
            ".heart-text, .heart-title, .member-card, .cta-section"
        );
        if (!targets.length) return;

        if (reduceMotion || !("IntersectionObserver" in window)) {
            targets.forEach(function (el) {
                el.classList.add("in-view");
            });
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var el = entry.target;
                        // Stagger member cards by their position in the grid
                        if (el.classList.contains("member-card")) {
                            var index = Array.prototype.indexOf.call(
                                document.querySelectorAll(".member-card"),
                                el
                            );
                            setTimeout(function () {
                                el.classList.add("in-view");
                            }, index * 120);
                        } else {
                            el.classList.add("in-view");
                        }
                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.2, rootMargin: "0px 0px -60px 0px" }
        );

        targets.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ----------------------------------------------------------------------
       #7 Magnetic image tilt
       Applies a subtle 3D tilt to each member image based on cursor
       position within the card. Desktop / fine-pointer only.
       ---------------------------------------------------------------------- */
    function initMagneticTilt() {
        if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

        var containers = document.querySelectorAll(".image-container");
        containers.forEach(function (container) {
            var img = container.querySelector("img");
            if (!img) return;

            container.addEventListener("mousemove", function (e) {
                var rect = container.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                var maxTilt = 6; // degrees
                img.style.transform =
                    "scale(1.0) rotateX(" +
                    (-y * maxTilt).toFixed(2) +
                    "deg) rotateY(" +
                    (x * maxTilt).toFixed(2) +
                    "deg)";
            });

            container.addEventListener("mouseleave", function () {
                img.style.transform = "";
            });
        });
    }

    /* ----------------------------------------------------------------------
       #15 Sticky header shrink on scroll
       ---------------------------------------------------------------------- */
    function initHeaderShrink() {
        var header = document.querySelector("header");
        if (!header) return;

        function onScroll() {
            if (window.scrollY > 40) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    /* ----------------------------------------------------------------------
       #17 Page transition fade
       Fades a full-screen overlay out on load, and fades it back in before
       navigating to internal links so page changes feel seamless.
       ---------------------------------------------------------------------- */
    function initPageTransitions() {
        var overlay = document.createElement("div");
        overlay.className = "page-transition-overlay";
        document.body.appendChild(overlay);

        // Reveal current page
        requestAnimationFrame(function () {
            overlay.classList.add("hidden");
        });

        if (reduceMotion) return;

        var internalLinks = document.querySelectorAll(
            'a[href$=".html"], a[href="index.html"]'
        );
        internalLinks.forEach(function (link) {
            link.addEventListener("click", function (e) {
                var href = link.getAttribute("href");
                if (!href || href.charAt(0) === "#") return;
                e.preventDefault();
                overlay.classList.remove("hidden");
                overlay.classList.add("leaving");
                setTimeout(function () {
                    window.location.href = href;
                }, 400);
            });
        });
    }

    /* ----------------------------------------------------------------------
       #18 Custom cursor ring
       Follows the pointer and expands over interactive elements.
       ---------------------------------------------------------------------- */
    function initCustomCursor() {
        if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

        var ring = document.createElement("div");
        ring.className = "cursor-ring";
        document.body.appendChild(ring);

        var mouseX = 0,
            mouseY = 0;

        document.addEventListener("mousemove", function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            ring.style.left = mouseX + "px";
            ring.style.top = mouseY + "px";
            ring.classList.add("active");
        });

        document.addEventListener("mouseleave", function () {
            ring.classList.remove("active");
        });

        var hoverTargets = document.querySelectorAll(
            ".member-card, .btn, .cta-buttons a, .cta-buttons button"
        );
        hoverTargets.forEach(function (el) {
            el.addEventListener("mouseenter", function () {
                ring.classList.add("hovering");
            });
            el.addEventListener("mouseleave", function () {
                ring.classList.remove("hovering");
            });
        });
    }

    /* ----------------------------------------------------------------------
       Safety net: each init runs independently. If one throws (browser
       quirk, blocked script, unexpected DOM state), the rest still run —
       most importantly initScrollReveal, which is what makes .heart-text,
       .member-card, and .cta-section visible in the first place.
       ---------------------------------------------------------------------- */
    function safeRun(fn) {
        try {
            fn();
        } catch (err) {
            console.error("[team.js] " + fn.name + " failed:", err);
        }
    }

    /* ----------------------------------------------------------------------
       Extra fallback: guarantee scroll-revealed content becomes visible
       no matter what, even if initScrollReveal itself never runs (e.g.
       team.js fails to load or errors before this point). Runs shortly
       after DOMContentLoaded regardless of JS success elsewhere.
       ---------------------------------------------------------------------- */
    function forceRevealFallback() {
        setTimeout(function () {
            document
                .querySelectorAll(
                    ".heart-text, .heart-title, .member-card, .cta-section"
                )
                .forEach(function (el) {
                    el.classList.add("in-view");
                });
        }, 2500);
    }

    /* ---------------------------------------------------------------------- */
    document.addEventListener("DOMContentLoaded", function () {
        safeRun(splitHeroTitle);
        safeRun(initHeroEntrance);
        safeRun(initParallax);
        safeRun(initScrollReveal);
        safeRun(initMagneticTilt);
        safeRun(initHeaderShrink);
        safeRun(initPageTransitions);
        safeRun(initCustomCursor);
        forceRevealFallback();
    });
})();