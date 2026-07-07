/* =========================================================
   contact.js — form submission logic + animation controller
   ========================================================= */

   function sendToWhatsApp(event){
    event.preventDefault();
  
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    const service = document.getElementById('serviceType').value.trim();
    const date = document.getElementById('eventDate').value.trim();
    const location = document.getElementById('eventLocation').value.trim();
    const message = document.getElementById('messageBox').value.trim();
  
    if(!name || !phone){
      alert('Please enter at least your name and phone number.');
      return;
    }
  
    const studioNumber = '919848403872'; // WhatsApp number with country code, no spaces or symbols
  
    let text = `Hello Giri Photography, I'd like to book a shoot.%0A%0A`;
    text += `*Name:* ${name}%0A`;
    text += `*Phone:* ${phone}%0A`;
    if(service) text += `*Service:* ${service}%0A`;
    if(date) text += `*Event Date:* ${date}%0A`;
    if(location) text += `*Location:* ${location}%0A`;
    if(message) text += `*Message:* ${message}%0A`;
  
    const waUrl = `https://wa.me/${studioNumber}?text=${encodeURIComponent(text.replace(/%0A/g,'\n'))}`;
  
    // success-state button morph before opening WhatsApp
    const btn = document.getElementById('submitBtn');
    const btnText = btn ? btn.querySelector('.btn-text') : null;
    if(btn && btnText){
      const original = btnText.textContent;
      btn.classList.add('is-success');
      btnText.textContent = '✓ Redirecting...';
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 450);
      setTimeout(() => {
        btn.classList.remove('is-success');
        btnText.textContent = original;
      }, 2000);
    } else {
      window.open(waUrl, '_blank');
    }
  }
  
  /* ---------------------------------------------------------
     ANIMATION CONTROLLER
     Runs on DOMContentLoaded; safe to no-op if elements absent.
  --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    // trigger hero stagger (page-load / preloader animation removed)
    document.body.classList.add('loaded');
  
    /* ---- Scroll reveals (IntersectionObserver) ---- */
    const revealEls = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    if('IntersectionObserver' in window && revealEls.length){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold:0.15, rootMargin:'0px 0px -40px 0px' });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
  
    /* ---- Gallery / fade-in images ---- */
    document.querySelectorAll('.fade-img').forEach(img => {
      if(img.complete){
        img.classList.add('is-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('is-loaded'), { once:true });
      }
    });
  
    /* ---- Floating label sync for the date field (type toggles text/date) ---- */
    const eventDate = document.getElementById('eventDate');
    if(eventDate){
      const label = eventDate.nextElementSibling;
      const syncDateLabel = () => {
        if(label) label.classList.toggle('label-static', true); // always floated (set in markup already)
      };
      syncDateLabel();
    }
  
  });