/* =========================================================
   main.js — Giri Photography
   Global site-wide behavior: mobile nav toggle + scroll
   hide/show header. Used across every page.
   ========================================================= */

   const header = document.querySelector('header');
   const navLinks = document.getElementById('navLinks');
   const navToggle = document.querySelector('.nav-toggle');
   
   /* Flag JS as active so CSS entrance-animation rules (gated on .js) can apply */
   document.documentElement.classList.add('js');
   
   /* =========================================================
      Mobile menu toggle
      ========================================================= */
   if (navToggle && navLinks) {
       navToggle.addEventListener('click', () => {
           navLinks.classList.toggle('nav-open');
           const isOpen = navLinks.classList.contains('nav-open');
           navToggle.setAttribute('aria-expanded', isOpen);
   
           if (isOpen) {
               header.classList.remove('header-hidden');
           }
   
           const icon = navToggle.querySelector('i');
           if (icon) {
               icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
           }
       }); 
   
       navLinks.querySelectorAll('a').forEach(link => {
           link.addEventListener('click', () => {
               navLinks.classList.remove('nav-open');
               navToggle.setAttribute('aria-expanded', 'false');
   
               const icon = navToggle.querySelector('i');
               if (icon) {
                   icon.className = 'fa-solid fa-bars';
               }
           });
       });
   
       /* Close on outside click */
       document.addEventListener('click', (e) => {
           const isOpen = navLinks.classList.contains('nav-open');
           const clickedInside = navLinks.contains(e.target) || navToggle.contains(e.target);
           if (isOpen && !clickedInside) {
               navLinks.classList.remove('nav-open');
               navToggle.setAttribute('aria-expanded', 'false');
               const icon = navToggle.querySelector('i');
               if (icon) icon.className = 'fa-solid fa-bars';
           }
       });
   
       /* Close on Escape */
       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape' && navLinks.classList.contains('nav-open')) {
               navLinks.classList.remove('nav-open');
               navToggle.setAttribute('aria-expanded', 'false');
               const icon = navToggle.querySelector('i');
               if (icon) icon.className = 'fa-solid fa-bars';
               navToggle.focus();
           }
       });
   }
   
   /* =========================================================
      Shadow + hide-on-scroll-down / show-on-scroll-up
      ========================================================= */
   if (header) {
       let lastScrollY = window.scrollY;
       let ticking = false;
       const HIDE_DELTA_THRESHOLD = 6; // px — scrolling down needs a deliberate move before hiding
       const SHOW_DELTA_THRESHOLD = 1; // px — scrolling up should reveal almost instantly, esp. on mobile
   
       function updateHeader() {
           const currentScrollY = window.scrollY;
           const delta = currentScrollY - lastScrollY;
   
           /* .scrolled is owned by home.js (SHRINK_AT threshold) — not duplicated here */
   
           if (navLinks && navLinks.classList.contains('nav-open')) {
               header.classList.remove('header-hidden');
               lastScrollY = currentScrollY;
           } else if (delta < -SHOW_DELTA_THRESHOLD) {
               header.classList.remove('header-hidden');
               lastScrollY = currentScrollY;
           } else if (delta > HIDE_DELTA_THRESHOLD && currentScrollY > 120) {
               header.classList.add('header-hidden');
               lastScrollY = currentScrollY;
           }
   
           ticking = false;
       }
   
       window.addEventListener('scroll', () => {
           if (!ticking) {
               requestAnimationFrame(updateHeader);
               ticking = true;
           }
       }, { passive: true });
   }