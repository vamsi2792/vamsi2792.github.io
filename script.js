(function () {
  var root = document.documentElement;
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motionOK = hasGsap && !reduceMq.matches;

  /* ---------- Pixel sprite (generated, so there are no image files) ---------- */
  var DEV = [
    '...hhhh...',
    '..hhhhhh..',
    '..hssssh..',
    '..sesses..',
    '..ssssss..',
    '...ssss...',
    '.bbbbbbbb.',
    'sbbbbbbbbs',
    'sbbbggbbbs',
    '.bbbbbbbb.',
    '..pppppp..',
    '..pp..pp..',
    '..pp..pp..',
    '.kkk..kkk.'
  ];
  var PAL = { h: '#3a2a55', s: '#f6cfa8', e: '#14142b', b: '#35d0ff', g: '#ffd34d', p: '#4b55c9', k: '#2a2f7a' };

  function spriteSvg(rows, from, to) {
    var w = rows[0].length, rects = '';
    for (var y = from; y < to; y++) {
      var x = 0;
      while (x < w) {
        var c = rows[y].charAt(x);
        if (c === '.') { x++; continue; }
        var run = 1;
        while (x + run < w && rows[y].charAt(x + run) === c) run++;
        rects += '<rect x="' + x + '" y="' + (y - from) + '" width="' + run + '" height="1" fill="' + PAL[c] + '"/>';
        x += run;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + (to - from) +
      '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + rects + '</svg>';
  }
  document.querySelectorAll('[data-sprite="full"]').forEach(function (el) { el.innerHTML = spriteSvg(DEV, 0, DEV.length); });
  document.querySelectorAll('[data-sprite="head"]').forEach(function (el) { el.innerHTML = spriteSvg(DEV, 0, 6); });

  /* ---------- Theme and CRT toggles ---------- */
  var themeBtn = document.getElementById('theme');
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var crtBtn = document.getElementById('crt');
  crtBtn.setAttribute('aria-pressed', String(root.classList.contains('crt')));
  crtBtn.addEventListener('click', function () {
    var on = root.classList.toggle('crt');
    crtBtn.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('crt', on ? '1' : '0'); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menu');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- XP bar: scroll progress (works without GSAP) ---------- */
  var fill = document.getElementById('xpfill');
  var xpText = document.getElementById('xp');
  var ticking = false;
  function updateXp() {
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    fill.style.transform = 'scaleX(' + p + ')';
    xpText.textContent = String(Math.round(p * 9999)).padStart(4, '0');
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateXp); }
  }, { passive: true });
  window.addEventListener('resize', updateXp);
  updateXp();

  /* ---------- Toasts (achievements) ---------- */
  var toastBox = document.getElementById('toasts');
  function toast(title, text) {
    if (!motionOK) return;
    while (toastBox.children.length >= 3) toastBox.removeChild(toastBox.firstChild);
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<b></b><span></span>';
    el.firstChild.textContent = title;
    el.lastChild.textContent = text;
    toastBox.appendChild(el);
    gsap.fromTo(el, { x: 90, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.7)' });
    gsap.to(el, { x: 90, opacity: 0, duration: 0.35, delay: 3.4, onComplete: function () { el.remove(); } });
  }

  /* ---------- Section spy: nav highlight, level, achievements ---------- */
  var ACH = {
    experience: ['ACHIEVEMENT UNLOCKED', 'Quest Log opened: 2 roles to explore'],
    projects: ['ACHIEVEMENT UNLOCKED', 'Side quests found: 5 projects to explore'],
    skills: ['ACHIEVEMENT UNLOCKED', 'Inventory opened: the full tech stack'],
    education: ['ACHIEVEMENT UNLOCKED', 'Training complete: M.S. CS + 2 Oracle badges'],
    contact: ['FINAL STAGE REACHED', 'Say hi: press the Insert coin button']
  };
  var lvlEl = document.getElementById('lvl');
  var links = {};
  document.querySelectorAll('nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var seen = {};

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        lvlEl.textContent = en.target.getAttribute('data-level') || '1';
        Object.keys(links).forEach(function (k) {
          links[k].classList.remove('active');
          links[k].removeAttribute('aria-current');
        });
        if (links[id]) { links[id].classList.add('active'); links[id].setAttribute('aria-current', 'true'); }
        if (ACH[id] && !seen[id]) { seen[id] = true; toast(ACH[id][0], ACH[id][1]); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Reveal fallback (no GSAP) ---------- */
  var items = document.querySelectorAll('.reveal');
  if (!hasGsap) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('in'); });
    }
    return;
  }

  /* ---------- GSAP animations ---------- */
  root.classList.add('gsap');
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    motionOK = true;

    // Title: split the name into characters for a "boot up" effect
    var h1 = document.getElementById('name');
    var nameText = h1.textContent.trim();
    h1.setAttribute('aria-label', nameText);
    h1.innerHTML = nameText.split(' ').map(function (word) {
      return '<span class="w">' + word.split('').map(function (c) {
        return '<span class="ch" aria-hidden="true">' + c + '</span>';
      }).join('') + '</span>';
    }).join(' ');

    var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .fromTo('.hero .reveal', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 })
      .fromTo('.hero .ch', { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: 'steps(3)' }, 0.1)
      .from('.stage-box .layer', { y: -160, duration: 0.9, ease: 'bounce.out' }, 0.5);

    // Count-up for the player stats ("−40%", "120+", "10K+", "80%")
    document.querySelectorAll('.stats dd').forEach(function (dd) {
      var m = dd.textContent.match(/^(\D*)(\d+)(.*)$/);
      if (!m) return;
      var counter = { n: 0 };
      gsap.to(counter, {
        n: +m[2], duration: 1.8, ease: 'power2.out', delay: 0.7,
        onUpdate: function () { dd.textContent = m[1] + Math.round(counter.n) + m[3]; }
      });
    });

    // Sections fade up as they enter the viewport
    gsap.utils.toArray('.reveal').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.fromTo(el, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    // Quest objectives tick off one by one
    gsap.utils.toArray('.job').forEach(function (job) {
      var pts = job.querySelectorAll('.points li');
      gsap.fromTo(pts, { '--tick': 0 }, {
        '--tick': 1, duration: 0.25, ease: 'back.out(3)', stagger: 0.28,
        scrollTrigger: { trigger: job, start: 'top 70%', once: true }
      });
      gsap.from(job.querySelectorAll('header .tags li'), {
        opacity: 0, scale: 0.6, duration: 0.4, ease: 'back.out(2.5)', stagger: 0.06,
        scrollTrigger: { trigger: job, start: 'top 80%', once: true }
      });
    });

    // Inventory items pop in
    gsap.utils.toArray('.slot, .card').forEach(function (box) {
      var tags = box.querySelectorAll('.tags li');
      if (!tags.length || box.closest('.job')) return;
      gsap.from(tags, {
        opacity: 0, scale: 0.5, duration: 0.4, ease: 'back.out(2.5)', stagger: 0.05,
        scrollTrigger: { trigger: box, start: 'top 82%', once: true }
      });
    });

    // Medals spin in
    gsap.from('.medal', {
      rotation: -360, scale: 0, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.15,
      scrollTrigger: { trigger: '.badge-card', start: 'top 85%', once: true }
    });

    // Continue? countdown
    var countEl = document.getElementById('count');
    var cd = { n: 9 };
    gsap.to(cd, {
      n: 0, duration: 9, ease: 'none', repeat: -1,
      onUpdate: function () { countEl.textContent = Math.ceil(cd.n); },
      scrollTrigger: { trigger: '#contact', start: 'top 80%', toggleActions: 'play pause resume pause' }
    });

    // Card tilt and hero parallax: only for devices with a hover pointer
    if (window.matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.tilt').forEach(function (card) {
        var rx = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power3' });
        var ry = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power3' });
        gsap.set(card, { transformPerspective: 800 });
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 8);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
        });
        card.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });

      var depthEls = Array.prototype.slice.call(document.querySelectorAll('.stage-box [data-depth]'));
      var movers = depthEls.map(function (el) {
        return { d: +el.getAttribute('data-depth'), x: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' }) };
      });
      document.querySelector('.hero').addEventListener('pointermove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        movers.forEach(function (m) { m.x(nx * m.d); m.y(ny * m.d); });
      });
    }

    // Click the character to jump
    var jumpBtn = document.querySelector('.jump');
    var lives = 0;
    jumpBtn.addEventListener('click', function () {
      if (gsap.isTweening(jumpBtn)) return;
      gsap.timeline()
        .to(jumpBtn, { y: -90, duration: 0.3, ease: 'power2.out' })
        .to(jumpBtn, { y: 0, duration: 0.45, ease: 'bounce.out' });
      lives++;
      toast('+1 UP', 'Extra lives: ' + lives);
    });

    // Konami code easter egg
    var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
      if (pos === code.length) { pos = 0; burst(); toast('CHEAT CODE ACTIVATED', '+30 lives. Nice.'); }
    });

    return function () { motionOK = false; };
  });

  // Pixel confetti
  function burst() {
    var fx = document.getElementById('fx');
    var colors = ['#39ff88', '#35d0ff', '#ff4fd8', '#ffd34d', '#8f94ff'];
    for (var i = 0; i < 70; i++) {
      var p = document.createElement('i');
      p.style.background = colors[i % colors.length];
      p.style.left = '50%';
      p.style.top = '40%';
      fx.appendChild(p);
      gsap.to(p, {
        x: gsap.utils.random(-window.innerWidth / 2, window.innerWidth / 2),
        y: gsap.utils.random(-200, window.innerHeight * 0.7),
        rotation: gsap.utils.random(-360, 360), opacity: 0,
        duration: gsap.utils.random(1.2, 2.2), ease: 'power2.out',
        onComplete: function () { this.targets()[0].remove(); }
      });
    }
  }
})();
