(() => {
    'use strict';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];

    /* ---------- Fundo de partículas conectadas ---------- */
    const canvas = $('#bg-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.width = innerWidth * dpr;
        H = canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(90, Math.floor((innerWidth * innerHeight) / 17000));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * innerWidth, y: Math.random() * innerHeight,
            vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
            r: Math.random() * 1.6 + .6
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
            if (p.y < 0 || p.y > innerHeight) p.vy *= -1;

            const dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = Math.hypot(dxm, dym);
            if (dm < 140) { p.x += dxm / dm * 1.2; p.y += dym / dm * 1.2; }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56,189,248,.65)';
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < 130) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(56,189,248,${(1 - d / 130) * .18})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }

    resize();
    addEventListener('resize', resize);
    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    if (!reduce) draw();

    /* ---------- Brilho que segue o cursor ---------- */
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    if (fine && !reduce) {
        addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
        (function follow() {
            gx += (tx - gx) * .12; gy += (ty - gy) * .12;
            glow.style.transform = `translate(${gx}px, ${gy}px)`;
            requestAnimationFrame(follow);
        })();
    } else glow.style.display = 'none';

    /* ---------- Efeito de digitação ---------- */
    const phrases = [
        'Estudante de Engenharia de Software',
        'Desenvolvedor em formação',
        'Apaixonado por tecnologia',
        'Baiano em Brasília'
    ];
    const typed = $('#typed');
    let pi = 0, ci = 0, deleting = false;
    function type() {
        const word = phrases[pi];
        typed.textContent = word.slice(0, ci);
        if (!deleting && ci < word.length) { ci++; setTimeout(type, 70); }
        else if (!deleting) { deleting = true; setTimeout(type, 1600); }
        else if (ci > 0) { ci--; setTimeout(type, 35); }
        else { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(type, 400); }
    }
    if (reduce) typed.textContent = phrases[0]; else type();

    /* ---------- Barra de scroll, header, voltar ao topo ---------- */
    const bar = $('.scroll-progress'), header = $('#header'), toTop = $('.to-top');
    function onScroll() {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (scrollY / max * 100) + '%';
        header.classList.toggle('scrolled', scrollY > 30);
        toTop.classList.toggle('show', scrollY > 600);
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

    /* ---------- Menu mobile ---------- */
    const toggle = $('.menu-toggle'), nav = $('#nav');
    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
        toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
    $$('#nav a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }));

    /* ---------- Link ativo no menu ---------- */
    const links = $$('#nav a');
    const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    /* ---------- Reveal + contadores + barras ---------- */
    function countUp(el) {
        const to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.decimals || 0, 10);
        if (reduce) { el.textContent = to.toFixed(dec); return; }
        const dur = 1600, t0 = performance.now();
        (function step(t) {
            const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
            el.textContent = (to * e).toFixed(dec);
            if (k < 1) requestAnimationFrame(step);
        })(t0);
    }

    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const el = en.target;
            const siblings = $$('.reveal', el.parentElement);
            el.style.transitionDelay = Math.min(siblings.indexOf(el), 6) * 90 + 'ms';
            el.classList.add('visible');
            $$('.count', el).forEach(countUp);
            $$('.progress-bar-fill', el).forEach(f => {
                f.style.left = (f.dataset.offset || 0) + '%';
                f.style.width = f.dataset.width + '%';
            });
            setTimeout(() => el.style.transitionDelay = '', 1200);
            io.unobserve(el);
        });
    }, { threshold: .15 });
    $$('.reveal').forEach(el => io.observe(el));

    /* ---------- Tilt 3D + brilho interno nos cartões ---------- */
    $$('.card-glass, .metric-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    if (fine && !reduce) {
        $$('[data-tilt]').forEach(el => {
            const max = parseFloat(el.dataset.tilt) || 6;
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - .5;
                const py = (e.clientY - r.top) / r.height - .5;
                el.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateZ(0)`;
            });
            el.addEventListener('mouseleave', () => { el.style.transform = ''; });
        });

        /* Botões magnéticos */
        $$('.magnetic').forEach(b => {
            b.addEventListener('mousemove', e => {
                const r = b.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * .25;
                const y = (e.clientY - r.top - r.height / 2) * .35;
                b.style.transform = `translate(${x}px, ${y}px)`;
            });
            b.addEventListener('mouseleave', () => { b.style.transform = ''; });
        });
    }

    /* ---------- Lightbox da galeria ---------- */
    const lb = $('.lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
    const items = $$('.gallery-item');
    let idx = 0;
    function show(i) {
        idx = (i + items.length) % items.length;
        const it = items[idx], img = $('img', it);
        lbImg.src = img.getAttribute('src');
        lbImg.alt = img.alt;
        lbCap.textContent = it.dataset.caption || img.alt;
    }
    function open(i) { show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    items.forEach((it, i) => it.addEventListener('click', () => open(i)));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(idx - 1);
        if (e.key === 'ArrowRight') show(idx + 1);
    });
})();
