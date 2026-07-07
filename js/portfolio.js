/* =========================================================
   portfolio.js — Giri Photography
   Page-specific behavior for the Portfolio/Gallery page:
   cinematic reel play/pause controls, scroll reveal,
   image load fade-in, page load fade-in, mobile menu stagger.
   (Global nav toggle + scroll header behavior lives in main.js)
   ========================================================= */

  /* =========================================================
     Portrait-video sizing — some cinematic clips are shot
     portrait/vertical rather than the default 16:9. Each clip
     has its own native aspect ratio, so instead of guessing one
     fixed box size for all of them (which causes letterbox bars
     on some), measure the real dimensions and set the card's
     aspect-ratio to match exactly. Result: no bars, no cropping.
     ========================================================= */
     (function(){
      var portraitPhs = document.querySelectorAll('.cine-card .ph.is-portrait');
  
      portraitPhs.forEach(function(ph){
        var video = ph.querySelector('video');
        var img = ph.querySelector('img');
        if(!video) return;
  
        function applyRatio(w, h){
          if(w && h) ph.style.aspectRatio = w + ' / ' + h;
        }
  
        // Poster image's natural size as an immediate best guess
        // (correct before the video itself has finished loading).
        if(img){
          if(img.complete && img.naturalWidth){
            applyRatio(img.naturalWidth, img.naturalHeight);
          } else {
            img.addEventListener('load', function(){
              applyRatio(img.naturalWidth, img.naturalHeight);
            });
          }
        }
  
        // Once real video metadata is available, correct to the
        // video's exact dimensions (this is the authoritative shape).
        if(video.readyState >= 1 && video.videoWidth){
          applyRatio(video.videoWidth, video.videoHeight);
        } else {
          video.addEventListener('loadedmetadata', function(){
            applyRatio(video.videoWidth, video.videoHeight);
          });
        }
      });
    })();
  
     (function(){
      var phEls = document.querySelectorAll('.cine-card .ph');
      var allVideos = [];
    
      phEls.forEach(function(ph){
        var video = ph.querySelector('video');
        var btn = ph.querySelector('.video-btn');
        if(!video || !btn) return;
        allVideos.push(video);
    
        function pauseOthers(){
          allVideos.forEach(function(v){
            if(v !== video && !v.paused){
              v.pause();
              var otherPh = v.closest('.ph');
              if(otherPh) otherPh.classList.remove('is-playing');
            }
          });
        }
    
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          if(video.paused){
            pauseOthers();
            video.play().then(function(){
              ph.classList.add('is-playing');
            }).catch(function(){
              // playback blocked (e.g. autoplay policy) — leave UI in paused state
            });
          } else {
            video.pause();
            ph.classList.remove('is-playing');
          }
        });
    
        video.addEventListener('ended', function(){
          ph.classList.add('is-playing');
        });
      });
    })();
    
    /* =========================================================
       Category gallery — clicking a category card swaps the
       category grid out for a 10-photo grid of that category.
       A "Back to Categories" button swaps the category grid
       back in. Only one view is ever visible at a time.
    
       folderMap maps each category slug to your actual folder
       name on disk. Photos are expected as 1.webp ... 10.webp
       inside each folder, sitting next to portfolio.html.
       ========================================================= */
    (function(){
      var categories = {
        'weddings': 'Weddings',
        'pre-wedding': 'Pre-Wedding',
        'engagement': 'Engagement',
        'haldi': 'Haldi',
        'birthdays': 'Birthdays',
        'dhoti-ceremony': 'Dhoti Ceremony',
        'saree-ceremony': 'Saree Ceremony',
        'newborn': 'Newborn',
        'maternity': 'Maternity',
        'solo-portraits': 'Solo Portraits'
      };
    
      // Photos for each category now live in data/portfolio/<slug>.json —
      // a small JSON file listing that category's images in order. The
      // admin panel (/admin) edits these files directly, so any photo
      // the client adds or replaces through the CMS shows up here
      // automatically, with no fixed filenames or counts required.
      var galleryDataCache = {};

      function loadCategoryData(slug){
        if(galleryDataCache[slug]) return galleryDataCache[slug];
        var promise = fetch('data/portfolio/' + slug + '.json')
          .then(function(res){ return res.json(); })
          .catch(function(){ return { name: categories[slug] || slug, images: [] }; });
        galleryDataCache[slug] = promise;
        return promise;
      }

      // Per-photo crop-position overrides. object-fit:cover trims equal
      // pixels off the top and bottom (or left/right) of a photo to fill
      // its box, centered by default. When a photo's subject sits near the
      // top or bottom of the original frame rather than dead-center, a
      // center-crop can cut them off almost entirely. There's no single
      // rule that fixes every photo — each one needs its own fix based on
      // where the subject actually is. Add an entry here for any photo
      // number (1-indexed, matching "Photo 0N") that looks wrong on the
      // site: 'top' keeps the top of the photo intact (crops more off the
      // bottom) — use this when a head/face is being cut off. 'bottom'
      // keeps the bottom intact (crops more off the top) — use this when
      // the subject is near the bottom edge and getting cropped away.
      // You can also use a percentage like '25%' or '80%' for finer control.
      var cropOverrides = {
        'solo-portraits': { 1: 'top', 8: 'bottom' },
        'birthdays': { 4: 'bottom' },
        'saree-ceremony': { 4: 'bottom' },
        'maternity': { 1: 'bottom' }
        // Add more as you spot them, e.g.:
        // 'pre-wedding': { 4: 'bottom' }
      };
    
      var order = ['weddings','pre-wedding','engagement','haldi','birthdays','dhoti-ceremony','saree-ceremony','newborn','maternity','solo-portraits'];
    
      var cards = document.querySelectorAll('.cat-card');
      var gridSection = document.getElementById('catGridSection');
      var gallery = document.getElementById('catGallery');
      var galleryTitle = document.getElementById('catGalleryTitle');
      var galleryGrid = document.getElementById('catGalleryGrid');
      var backBtn = document.getElementById('catGalleryBack');
      var nextBtn = document.getElementById('catGalleryNext');
      var nextName = document.getElementById('catGalleryNextName');
      if(!cards.length || !gridSection || !gallery || !galleryGrid) return;
    
      function buildGrid(slug, name){
        var overrides = cropOverrides[slug] || {};
        galleryGrid.innerHTML = '<div class="gallery-loading">Loading photos&hellip;</div>';

        loadCategoryData(slug).then(function(data){
          var images = data.images || [];
          var html = '';
          images.forEach(function(src, idx){
            var i = idx + 1;
            var n = i < 10 ? '0' + i : String(i);
            var posStyle = overrides[i] ? ' style="object-position:center ' + overrides[i] + '"' : '';
            // reveal-delay-1 on the second tile of each visual pair gives
            // the row a small cascade rather than both tiles popping in
            // at the exact same instant.
            var delayClass = (i % 2 === 0) ? ' reveal-delay-1' : '';
            html += '<div class="tile reveal' + delayClass + '">' +
                      '<div class="ph"><img src="' + src + '" alt="' + name + ' photo ' + n + '"' + posStyle + '></div>' +
                      '<div class="cap">Photo ' + n + '</div>' +
                    '</div>';
          });
          galleryGrid.innerHTML = html || '<div class="gallery-loading">No photos in this category yet.</div>';

          galleryGrid.querySelectorAll('.ph img').forEach(function(img){
            function markLoaded(){
              img.classList.add('img-loaded');
              var ph = img.closest('.ph');
              if(ph) ph.classList.add('ph-loaded');
            }
            if(img.complete && img.naturalWidth > 0){
              markLoaded();
            } else {
              img.addEventListener('load', markLoaded);
              img.addEventListener('error', markLoaded);
            }
          });
    
          // Reveal these freshly-built photo tiles in pairs (2 at a time),
          // matching the large+small tile pattern of each visual row, the
          // same way the category cards above reveal as a pair.
          if(window.revealObserveGroups){
            window.revealObserveGroups(Array.prototype.slice.call(galleryGrid.querySelectorAll('.tile.reveal')), 2);
          }
        });
      }
    
      function currentSlug(){
        var text = galleryTitle.textContent.trim().toLowerCase();
        for(var i=0;i<order.length;i++){
          if(categories[order[i]].toLowerCase() === text) return order[i];
        }
        return null;
      }
    
      function refreshNext(){
        var cur = currentSlug();
        if(!cur || !nextBtn){ if(nextBtn) nextBtn.style.display = 'none'; return; }
        var idx = order.indexOf(cur);
        var nextSlug = order[(idx + 1) % order.length];
        nextName.textContent = categories[nextSlug];
        nextBtn.dataset.nextSlug = nextSlug;
        nextBtn.style.display = '';
      }
    
      function showGallery(slug){
        var name = categories[slug] || slug;
        galleryTitle.textContent = name;
        buildGrid(slug, name);
        refreshNext();
    
        gridSection.classList.add('is-hidden');
        gallery.classList.add('is-open');
        gallery.setAttribute('aria-hidden', 'false');
    
        window.scrollTo({ top: gallery.offsetTop - 20, behavior: 'instant' in window ? 'instant' : 'auto' });
      }
    
      function showGrid(){
        gallery.classList.remove('is-open');
        gallery.setAttribute('aria-hidden', 'true');
        gridSection.classList.remove('is-hidden');
    
        window.scrollTo({ top: gridSection.offsetTop - 20, behavior: 'instant' in window ? 'instant' : 'auto' });
      }
    
      cards.forEach(function(card){
        card.addEventListener('click', function(){
          showGallery(card.getAttribute('data-category'));
        });
      });
    
      backBtn.addEventListener('click', showGrid);
    
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' && gallery.classList.contains('is-open')) showGrid();
      });
    
      if(nextBtn){
        nextBtn.addEventListener('click', function(){
          var slug = nextBtn.dataset.nextSlug;
          if(!slug) return;
          var target = document.querySelector('.cat-card[data-category="' + slug + '"]');
          if(target){
            target.click();
            gallery.scrollIntoView({ behavior:'smooth', block:'start' });
          }
        });
      }

      // Keep each category tile's cover photo in sync with whatever the
      // client has set as photo #1 for that category in the CMS, so a
      // replaced cover image shows up on the grid without editing HTML.
      cards.forEach(function(card){
        var slug = card.getAttribute('data-category');
        var img = card.querySelector('.ph img');
        if(!slug || !img) return;
        loadCategoryData(slug).then(function(data){
          if(data.images && data.images[0]){
            img.src = data.images[0];
          }
        });
      });
    })();
    
    /* =========================================================
       Scroll reveal — fades gallery tiles / cinematic cards up
       as they enter the viewport. Fires once per element, except
       for category cards and category-gallery photos, which are
       revealed in pairs (matching each visual row of 2) so a full
       row animates in together instead of one tile at a time —
       this is what actually reads as "2 at once" on mobile, since
       each category-row / photo-row IS 2 tiles regardless of
       viewport width.
    
       window.revealObserveGroups() is exposed so the category
       gallery builder (below) can register its freshly-created
       photo tiles the moment they're inserted into the DOM.
       ========================================================= */
    (function(){
      var supported = 'IntersectionObserver' in window;
    
      var observer = supported ? new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting) return;
          var el = entry.target;
          observer.unobserve(el);
    
          // Paired elements reveal together: whichever one of the
          // pair crosses the threshold first triggers both.
          var group = el.__revealGroup;
          if(group){
            group.forEach(function(sibling){
              sibling.classList.add('is-visible');
              if(sibling !== el) observer.unobserve(sibling);
            });
          } else {
            el.classList.add('is-visible');
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
      }) : null;
    
      // Groups `elements` into chunks of `size` (default 2) and reveals
      // each chunk together as a unit once any member enters view.
      function observeInGroups(elements, size){
        size = size || 2;
        if(!supported){
          elements.forEach(function(el){ el.classList.add('is-visible'); });
          return;
        }
        for(var i = 0; i < elements.length; i += size){
          var group = Array.prototype.slice.call(elements, i, i + size);
          group.forEach(function(el){
            el.__revealGroup = group;
            observer.observe(el);
          });
        }
      }

      function observeIndividually(elements){
        if(!supported){
          elements.forEach(function(el){ el.classList.add('is-visible'); });
          return;
        }
        elements.forEach(function(el){ observer.observe(el); });
      }
    
      // Standalone text/heading/footer reveals — these don't come in
      // visual pairs, so each animates independently as before.
      var standalone = document.querySelectorAll('.reveal:not(.cat-card)');
      observeIndividually(standalone);
    
      // Category cards — two per category-row — reveal as a pair.
      var catCards = document.querySelectorAll('.cat-card.reveal');
      observeInGroups(catCards, 2);
    
      // Exposed so newly-built category-gallery photo tiles (created
      // dynamically when a category is opened) can hook into the same
      // paired reveal behavior.
      window.revealObserveGroups = observeInGroups;
    })();
    
    /* =========================================================
       Image load fade-in — gallery tiles and cinematic posters
       fade in individually once their image has actually loaded,
       instead of popping in against the placeholder background.
       Also marks the parent .ph as loaded, which stops the
       placeholder shimmer animation defined in portfolio.css.
       ========================================================= */
    (function(){
      var imgs = document.querySelectorAll('.tile .ph img, .cine-card .ph img');
      if(!imgs.length) return;
    
      imgs.forEach(function(img){
        function markLoaded(){
          img.classList.add('img-loaded');
          var ph = img.closest('.ph');
          if(ph) ph.classList.add('ph-loaded');
        }
    
        if(img.complete && img.naturalWidth > 0){
          markLoaded();
        } else {
          img.addEventListener('load', markLoaded);
          img.addEventListener('error', markLoaded);
        }
      });
    })();
    
    /* =========================================================
       Mobile menu stagger — adds/removes a class on the mobile
       nav list based on the toggle button's aria-expanded state
       (set by main.js), so the links can fade/slide in with a
       stagger purely via CSS without touching main.js's own
       open/close logic.
       ========================================================= */
    (function(){
      var toggle = document.querySelector('.nav-toggle');
      var navLinks = document.getElementById('navLinks');
      if(!toggle || !navLinks || !('MutationObserver' in window)) return;
    
      function sync(){
        if(toggle.getAttribute('aria-expanded') === 'true'){
          navLinks.classList.add('menu-animate');
        } else {
          navLinks.classList.remove('menu-animate');
        }
      }
    
      var mo = new MutationObserver(sync);
      mo.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
      sync();
    })();
    
    /* =========================================================
       Swipe navigation — on touch devices, people instinctively try
       to swipe through a photo gallery. Swiping left inside the open
       category gallery moves to the next category (same as tapping
       the "Next" button); swiping right goes back to the category
       grid (same as "Back to Categories"). Ignored if the gesture is
       mostly vertical (a normal scroll) or too short to be deliberate.
       ========================================================= */
    (function(){
      var galleryEl = document.getElementById('catGallery');
      var nextBtn = document.getElementById('catGalleryNext');
      var backBtn = document.getElementById('catGalleryBack');
      if(!galleryEl) return;
    
      var startX = null, startY = null;
    
      galleryEl.addEventListener('touchstart', function(e){
        if(e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
    
      galleryEl.addEventListener('touchend', function(e){
        if(startX === null) return;
        var endX = e.changedTouches[0].clientX;
        var endY = e.changedTouches[0].clientY;
        var dx = endX - startX;
        var dy = endY - startY;
        startX = null;
        startY = null;
    
        var isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
        var isDeliberate = Math.abs(dx) > 60;
        if(!isHorizontal || !isDeliberate) return;
    
        if(dx < 0 && nextBtn){
          nextBtn.click();
        } else if(dx > 0 && backBtn){
          backBtn.click();
        }
      }, { passive: true });
    })();
    
    /* =========================================================
       Page load fade-in — whole page fades in once the DOM is
       ready, rather than snapping into view instantly.
       ========================================================= */
    (function(){
      function reveal(){ document.body.classList.add('page-loaded'); }
    
      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', reveal);
      } else {
        requestAnimationFrame(reveal);
      }
    
      setTimeout(reveal, 1500);
    })();