'use strict';

/* ---------- Data ---------- */
const products = [
  { id: 'choc-cake', name: 'Dark chocolate cake', price: 750, category: 'cakes', image: 'cake-chocolate', description: 'Rich cocoa layers, gently sweetened. 500 g.', badge: "Chef Anu's pick" },
  { id: 'blueberry-muffin', name: 'Blueberry oat muffin', price: 120, category: 'muffins', image: 'muffins', description: 'Oats, juicy blueberries and a soft crumb.', badge: 'Breakfast hero' },
  { id: 'brownie', name: 'Fudgy walnut brownie', price: 110, category: 'brownies', image: 'brownies', description: 'Dense, fudgy and full of walnuts.', badge: 'Fudgy' },
  { id: 'tiramisu-jar', name: 'Tiramisu jar', price: 220, category: 'tiramisu', image: 'tiramisu-jars', description: 'Mascarpone cream and cocoa, layered in a jar.', badge: 'Made fresh' },
  { id: 'sourdough', name: 'Whole wheat sourdough', price: 280, category: 'breads', image: 'sourdough', description: 'Slow-fermented with whole wheat flour. Whole loaf.', badge: 'Wholegrain' },
  { id: 'berry-cake', name: 'Berry cream cake', price: 850, category: 'cakes', image: 'cake-berry', description: 'Light sponge, fresh berries and cream. 500 g.' },
  { id: 'crumble-muffin', name: 'Blueberry crumble muffin', price: 140, category: 'muffins', image: 'muffin-crumble', description: 'A golden crumble top over bursting berries.' },
  { id: 'seeded-loaf', name: 'Seeded multigrain loaf', price: 260, category: 'breads', image: 'hero', description: 'Packed with seeds and whole grains. Whole loaf.' },
  { id: 'brownie-box', name: 'Brownie box of six', price: 599, category: 'brownies', image: 'brownies-tray', description: 'Six fudgy squares to share (or not).' },
  { id: 'tiramisu-slice', name: 'Classic tiramisu slice', price: 240, category: 'tiramisu', image: 'tiramisu', description: 'Soft layers, dusted with cocoa.' }
];
const featuredIds = ['choc-cake', 'blueberry-muffin', 'brownie'];
const dailyIds = ['choc-cake', 'sourdough', 'blueberry-muffin', 'brownie', 'tiramisu-jar'];
const titles = { home: 'Healthy home bakes', menu: 'Our bakes', about: 'Chef Anu', visit: 'Visit', customise: 'Customise your order' };

/* Owner contact details. WhatsApp number: country code (91 = India) + number, digits only. */
const CONFIG = { brand: 'ANKRITA', email: 'ankrita1_1@yopmail.com', whatsapp: '911234567890' };
const byId = id => products.find(product => product.id === id);

/* ---------- Helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const money = amount => rupees.format(amount);
const EASE_WIPE = 'cubic-bezier(.77,0,.18,1)';
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const fineQuery = matchMedia('(hover: hover) and (pointer: fine)');
const motionOn = () => !reducedQuery.matches;

const cart = new Map();
const views = $$('.view');
const header = $('#site-header');
const nav = $('#navigation');
const navPill = $('.nav-pill');
const menuToggle = $('#menu-toggle');
const cartDialog = $('#cart-dialog');
const helpDialog = $('#help-dialog');
const curtain = $('.curtain');
let activeView = null;
let transitioning = false;
let toastTimer;
let lastCartTrigger;
let lastHelpTrigger;

/* ---------- Split text into masked words / characters ---------- */
function splitText(element) {
  if (element.dataset.splitDone) return;
  const chars = element.dataset.split === 'chars';
  let index = 0;
  const label = element.cloneNode(true);
  label.querySelectorAll('br').forEach(br => br.replaceWith(' '));
  element.setAttribute('aria-label', label.textContent.replace(/\s+/g, ' ').trim());
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return fragment.append(' ');
          const word = document.createElement('span');
          word.className = 'w';
          word.setAttribute('aria-hidden', 'true');
          [...(chars ? part : [part])].forEach(piece => {
            const unit = document.createElement('span');
            unit.className = 'c';
            unit.style.setProperty('--i', index++);
            unit.textContent = piece;
            word.append(unit);
          });
          fragment.append(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') walk(child);
    });
  };
  walk(element);
  element.dataset.splitDone = '1';
  element.classList.add('is-split');
}

/* ---------- Scroll-triggered reveals ---------- */
const revealSelector = '.reveal, .wipe, .draw-on-view, [data-split], [data-count]';
let revealObserver;

function countUp(element) {
  const target = Number(element.dataset.count);
  if (!motionOn()) return void (element.textContent = target);
  const start = performance.now();
  const step = now => {
    const progress = clamp((now - start) / 1700);
    element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 4)));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function reveal(element) {
  element.classList.add('is-visible');
  if (element.dataset.count) countUp(element);
}

function resetReveals(root) {
  $$(revealSelector, root).forEach(element => {
    element.classList.remove('is-visible');
    if (element.dataset.count) element.textContent = '0';
  });
}

function observeReveals() {
  revealObserver?.disconnect();
  const targets = $$(revealSelector).filter(element => !element.closest('.view[hidden]') && !element.classList.contains('is-visible'));
  if (!('IntersectionObserver' in window) || !motionOn()) {
    targets.forEach(reveal);
    return;
  }
  revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    reveal(entry.target);
    revealObserver.unobserve(entry.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(element => revealObserver.observe(element));
}

/* ---------- Scroll-scrubbed motion: flip, pan, parallax, rotate ---------- */
let scrubItems = [];
const scrubObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.target._scrub) entry.target._scrub.live = entry.isIntersecting; });
    queueFrame();
  }, { rootMargin: '30% 0px' })
  : null;

function clearScrub() {
  scrubItems.forEach(({ el }) => { el.style.transform = ''; el.style.translate = ''; el.style.rotate = ''; el.style.opacity = ''; });
}

function collectScrub() {
  scrubObserver?.disconnect();
  clearScrub();
  scrubItems = [];
  if (!motionOn() || !scrubObserver) return;
  $$('[data-flip], [data-pan], [data-speed], [data-rotate]').filter(el => !el.closest('.view[hidden]')).forEach(el => {
    const ref = el.parentElement;
    const kind = el.hasAttribute('data-flip') ? 'flip' : el.hasAttribute('data-pan') ? 'pan' : el.hasAttribute('data-speed') ? 'speed' : 'rotate';
    ref._scrub = { el, ref, kind, live: false };
    scrubItems.push(ref._scrub);
    scrubObserver.observe(ref);
  });
}

const progressBar = $('.progress');
let lastY = scrollY;
let frameQueued = false;

function frame() {
  frameQueued = false;
  const y = scrollY;
  const vh = innerHeight;
  const delta = y - lastY;
  lastY = y;

  header.classList.toggle('is-scrolled', y > 30);
  if (!nav.classList.contains('open')) {
    if (y > 260 && delta > 4) header.classList.add('is-hidden');
    else if (delta < -4 || y < 260) header.classList.remove('is-hidden');
  }
  progressBar.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - vh))})`;

  const live = scrubItems.filter(item => item.live);
  const rects = live.map(item => item.ref.getBoundingClientRect());
  const narrow = innerWidth < 860;
  live.forEach((item, index) => {
    const rect = rects[index];
    const p = clamp((vh - rect.top) / (vh + rect.height));
    const { el, kind } = item;
    if (kind === 'flip') {
      const t = (p - 0.5) * 2;
      const angle = 60 * Math.sign(t) * Math.pow(Math.abs(t), 1.7) * (narrow ? 0.65 : 1);
      el.style.transform = `perspective(1000px) rotateY(${angle}deg) scale(${1 - 0.06 * Math.abs(t)})`;
    } else if (kind === 'pan') {
      const k = clamp(p / 0.5);
      const distance = Number(el.dataset.pan) * Math.min(1, innerWidth / 1100);
      el.style.transform = `translateX(${distance * (1 - k)}px)`;
      el.style.opacity = String(0.25 + 0.75 * clamp(k * 1.4));
    } else if (kind === 'speed') {
      const shift = (p - 0.5) * 2 * 0.08 * rect.height * Number(el.dataset.speed || 1);
      el.style.translate = `0 ${shift}px`;
    } else {
      el.style.rotate = `${(p - 0.5) * 80 * Number(el.dataset.rotate || 1)}deg`;
    }
  });
}

function queueFrame() {
  if (!frameQueued) {
    frameQueued = true;
    requestAnimationFrame(frame);
  }
}

/* ---------- Ticker that reacts to scroll velocity ---------- */
const marquee = $('.marquee-track');
let marqueeX = 0;
let marqueeVelocity = 0;
let marqueeLastY = scrollY;
let marqueeVisible = false;

function marqueeTick() {
  requestAnimationFrame(marqueeTick);
  if (!marqueeVisible || !motionOn()) return;
  marqueeVelocity += ((scrollY - marqueeLastY) - marqueeVelocity) * 0.12;
  marqueeLastY = scrollY;
  const half = marquee.scrollWidth / 2;
  marqueeX -= 1.1 + marqueeVelocity * 0.35;
  if (marqueeX <= -half) marqueeX += half;
  if (marqueeX > 0) marqueeX -= half;
  marquee.style.transform = `translate3d(${marqueeX}px,0,0) skewX(${clamp(-marqueeVelocity * 0.25, -12, 12)}deg)`;
}

if (marquee && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => { marqueeVisible = entries[0].isIntersecting; }, { rootMargin: '100px' }).observe(marquee.parentElement);
  document.documentElement.classList.add('js-marquee');
  requestAnimationFrame(marqueeTick);
}

/* ---------- Page curtain and routing ---------- */
const finishWithin = (animation, ms) => Promise.race([animation.finished.catch(() => {}), new Promise(resolve => setTimeout(resolve, ms))]);

async function curtainIn(label) {
  const text = $('span', curtain);
  text.textContent = label;
  curtain.hidden = false;
  text.animate([{ translate: '0 60px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 650, delay: 250, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
  await finishWithin(curtain.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700, easing: EASE_WIPE, fill: 'forwards' }), 1300);
}

async function curtainOut() {
  setTimeout(observeReveals, 380);
  await finishWithin(curtain.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 800, delay: 200, easing: EASE_WIPE, fill: 'forwards' }), 1500);
  curtain.getAnimations().forEach(animation => animation.cancel());
  $('span', curtain).getAnimations().forEach(animation => animation.cancel());
  curtain.hidden = true;
}

function resolveRoute() {
  const hash = location.hash.slice(1) || 'home';
  const view = views.find(item => item.id === hash);
  const anchor = view ? null : document.getElementById(hash);
  const fallback = $(`#${activeView || 'home'}`);
  return { hash, anchor, unknown: !view && !anchor && hash !== 'home', view: view || anchor?.closest('.view') || (anchor ? fallback : $('#home')) };
}

function movePill(link) {
  if (!link || getComputedStyle(navPill).display === 'none') return;
  navPill.style.setProperty('--x', `${link.offsetLeft}px`);
  navPill.style.setProperty('--w', `${link.offsetWidth}px`);
  navPill.classList.add('on');
}

function showView(view) {
  views.forEach(item => { item.hidden = item !== view; });
  resetReveals(view);
  activeView = view.id;
  $$('#navigation a').forEach(link => {
    if (link.hash === `#${activeView}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `ANKRITA | ${titles[activeView]}`;
  scrollTo({ top: 0, behavior: 'instant' });
  header.classList.remove('is-hidden');
  collectScrub();
  movePill($('a[aria-current]', nav));
  queueFrame();
}

async function route(initial = false) {
  const target = resolveRoute();
  if (target.unknown) history.replaceState(null, '', '#home');
  closeNavigation();
  if (target.view.id === activeView) {
    // In-view anchors are scrolled natively by the browser; a second smooth scroll would overshoot.
    if (!target.anchor) scrollTo({ top: 0, behavior: motionOn() ? 'smooth' : 'instant' });
    return;
  }
  if (transitioning) return;
  transitioning = true;
  if (initial || !motionOn()) {
    showView(target.view);
    target.anchor?.scrollIntoView({ behavior: 'instant' });
    setTimeout(observeReveals, initial ? 150 : 0);
  } else {
    await curtainIn(titles[target.view.id]);
    showView(target.view);
    target.anchor?.scrollIntoView({ behavior: 'instant' });
    await curtainOut();
  }
  if (!initial) $('h1', target.view).focus({ preventScroll: true });
  transitioning = false;
  if (resolveRoute().view.id !== activeView) route();
}

/* ---------- Navigation ---------- */
function closeNavigation(restoreFocus = false) {
  nav.classList.remove('open');
  document.body.classList.remove('nav-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  if (restoreFocus) menuToggle.focus();
}

/* ---------- Rendering ---------- */
function productMarkup(product, index) {
  const delay = (index % 3) * 110;
  return `<article class="product-card reveal" style="--delay:${delay}ms"><div class="media product-image tilt wipe" style="--delay:${delay}ms"><img data-speed="0.7" src="images/${product.image}.jpg" alt="${product.name}" width="800" height="880" loading="lazy">${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}<button type="button" class="add-button" data-add="${product.id}" aria-label="Add ${product.name} to bag" title="Add ${product.name}">+</button></div><div class="product-info"><h3>${product.name}</h3><span>${money(product.price)}</span></div><p>${product.description}</p></article>`;
}

function renderProducts(filter = 'all') {
  $('#menu-products').innerHTML = products.filter(product => filter === 'all' || product.category === filter).map(productMarkup).join('');
  $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  collectScrub();
  observeReveals();
  queueFrame();
}

function renderCart() {
  let count = 0;
  let total = 0;
  const lines = [...cart].map(([id, quantity]) => {
    const product = products.find(item => item.id === id);
    count += quantity;
    total += quantity * product.price;
    return `<article class="cart-item"><img src="images/${product.image}.jpg" alt="${product.name}" width="75" height="90"><div><h3>${product.name}</h3><p>${money(product.price)} each</p><div class="quantity"><button type="button" data-quantity="${id}" data-change="-1" aria-label="One fewer ${product.name}">&minus;</button><span aria-label="Quantity ${quantity}">${quantity}</span><button type="button" data-quantity="${id}" data-change="1" aria-label="One more ${product.name}">+</button></div></div><div><p>${money(quantity * product.price)}</p><button type="button" class="remove-item" data-remove="${id}" aria-label="Remove ${product.name}">Remove</button></div></article>`;
  }).join('');
  $('#cart-items').innerHTML = lines || '<div class="empty-bag"><h3>A little room for joy.</h3><p>Your bag is waiting for something delicious.</p><button type="button" class="button button-dark" id="browse-menu"><span>Explore the menu</span></button></div>';
  $('#cart-count').textContent = count;
  $('#open-cart').setAttribute('aria-label', `Open bag, ${count} ${count === 1 ? 'item' : 'items'}`);
  $('#cart-total').textContent = money(total);
  $('#cart-summary').hidden = !count;
}

function notify(message) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------- Delight: fly-to-bag, confetti ---------- */
function flyToBag(source, product) {
  const bag = $('#open-cart');
  const bump = () => {
    bag.classList.remove('bump');
    void bag.offsetWidth;
    bag.classList.add('bump');
  };
  if (!source || !motionOn()) return;
  const from = source.getBoundingClientRect();
  const to = bag.getBoundingClientRect();
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const dot = document.createElement('img');
  dot.className = 'fly';
  dot.alt = '';
  dot.src = `images/${product.image}.jpg`;
  dot.style.left = `${from.left + from.width / 2 - 28}px`;
  dot.style.top = `${from.top + from.height / 2 - 28}px`;
  document.body.append(dot);
  dot.animate([
    { transform: 'translate(0,0) scale(.6)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 110}px) scale(1)`, opacity: 1, offset: 0.45 },
    { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: .5 }
  ], { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.then(() => { dot.remove(); bump(); }).catch(() => dot.remove());
}

function confettiBurst() {
  if (!motionOn()) return;
  const colors = ['#fdb3ee', '#f6dd8e', '#dbe5cf', '#422a22'];
  const originX = innerWidth / 2;
  const originY = innerHeight / 2;
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.background = colors[i % colors.length];
    cartDialog.append(piece);
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 260;
    piece.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance + 120}px) scale(.3)`, opacity: 0 }
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => piece.remove()).catch(() => piece.remove());
  }
}

function addToCart(id, trigger) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const quantity = cart.get(id) || 0;
  if (quantity >= 99) return notify('A maximum of 99 of each good thing.');
  cart.set(id, quantity + 1);
  renderCart();
  flyToBag(trigger, product);
  notify(`${product.name} added to your bag.`);
}

/* ---------- Pointer effects: card tilt, magnetic buttons, nav pill ---------- */
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !fineQuery.matches || !motionOn()) return;
  const tilt = event.target.closest?.('.tilt');
  if (tilt) {
    const rect = tilt.getBoundingClientRect();
    tilt.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width - 0.5) * 12}deg`);
    tilt.style.setProperty('--rx', `${-((event.clientY - rect.top) / rect.height - 0.5) * 12}deg`);
  }
  const magnet = event.target.closest?.('.magnetic');
  if (magnet) {
    const rect = magnet.getBoundingClientRect();
    magnet.style.translate = `${(event.clientX - rect.left - rect.width / 2) * 0.22}px ${(event.clientY - rect.top - rect.height / 2) * 0.35}px`;
  }
});

document.addEventListener('pointerout', event => {
  const leave = selector => {
    const element = event.target.closest?.(selector);
    return element && !element.contains(event.relatedTarget) ? element : null;
  };
  const tilt = leave('.tilt');
  if (tilt) { tilt.style.removeProperty('--rx'); tilt.style.removeProperty('--ry'); }
  const magnet = leave('.magnetic');
  if (magnet) magnet.style.translate = '';
});

nav.addEventListener('pointerover', event => movePill(event.target.closest('a')));
nav.addEventListener('pointerleave', () => movePill($('a[aria-current]', nav)));

/* ---------- Events ---------- */
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('open', open);
  document.body.classList.toggle('nav-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  [cartDialog, helpDialog].forEach(dialog => { if (dialog.open) dialog.close(); });
  if (nav.classList.contains('open')) closeNavigation(true);
});

document.addEventListener('click', event => {
  const addButton = event.target.closest('[data-add]');
  if (addButton) addToCart(addButton.dataset.add, addButton);
  const filter = event.target.closest('[data-filter]');
  if (filter) renderProducts(filter.dataset.filter);
  const quantityButton = event.target.closest('[data-quantity]');
  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    const next = Math.min(99, (cart.get(id) || 0) + Number(quantityButton.dataset.change));
    if (next <= 0) cart.delete(id); else cart.set(id, next);
    renderCart();
    (cartDialog.querySelector(`[data-quantity="${id}"][data-change="${quantityButton.dataset.change}"]`) || cartDialog.querySelector('button')).focus();
  }
  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    renderCart();
    $('#close-cart').focus();
  }
  if (event.target.closest('#browse-menu')) {
    cartDialog.close();
    location.hash = 'menu';
  }
  if (event.target.closest('#edit-order')) setStep('order');
  if (event.target.closest('#new-order')) {
    cart.clear();
    renderCart();
    orderForm.reset();
    delete orderForm.dataset.lat;
    delete orderForm.dataset.lng;
    updateAfterHours();
    setStep('bag');
  }
  const link = event.target.closest('a[href^="#"]');
  if (link) {
    closeNavigation();
    if (link.hash === location.hash && views.some(view => `#${view.id}` === link.hash)) {
      scrollTo({ top: 0, behavior: motionOn() ? 'smooth' : 'instant' });
      $(`${link.hash} h1`).focus({ preventScroll: true });
    }
  }
  if (!event.target.closest('.site-header')) closeNavigation();
});

$('#open-cart').addEventListener('click', event => {
  lastCartTrigger = event.currentTarget;
  if (!cartDialog.open) cartDialog.showModal();
});
$('#close-cart').addEventListener('click', () => cartDialog.close());
cartDialog.addEventListener('close', () => {
  lastCartTrigger?.focus();
  setStep('bag');
});
const closeOnBackdrop = dialog => dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
closeOnBackdrop(cartDialog);
closeOnBackdrop(helpDialog);

/* ---------- Order flow: form, WhatsApp and email ---------- */
const orderForm = $('#order-form');
const customForm = $('#custom-form');
const helpForm = $('#help-form');
const stepPanels = { bag: $('#bag-step'), order: orderForm, done: $('#checkout-message') };
const stepTitles = { bag: ["Fresh from Chef Anu's kitchen", 'Your bag.'], order: ['Almost there', 'Place your order.'], done: ['Order ready', 'One last step.'] };

const waLink = text => `https://wa.me/${CONFIG.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
const mailLink = (subject, body) => `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;
const singleLine = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const orderRows = () => [...cart].map(([id, quantity]) => ({ product: byId(id), quantity, amount: byId(id).price * quantity }));
const orderTotal = () => orderRows().reduce((sum, row) => sum + row.amount, 0);

function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : null;
}

function phoneDigits(value) {
  let digits = String(value).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.slice(0, 10);
}

document.addEventListener('input', event => {
  const input = event.target;
  if (input.matches?.('input[name="needed"], input[name="time"]')) {
    checkSlot(input.form);
    if (input.form === orderForm) updateAfterHours();
    return;
  }
  if (!input.matches?.('input[type="tel"]')) return;
  const digits = phoneDigits(input.value);
  if (digits !== input.value) input.value = digits;
});

function setStep(step) {
  Object.entries(stepPanels).forEach(([name, panel]) => { panel.hidden = name !== step; });
  const [eyebrow, title] = stepTitles[step];
  $('#cart-eyebrow').textContent = eyebrow;
  $('#cart-title').textContent = title;
  cartDialog.dataset.step = step;
  cartDialog.scrollTo({ top: 0 });
}

function formatRequired(dateValue, timeValue) {
  if (!dateValue) return '';
  const when = new Date(`${dateValue}T${timeValue || '00:00'}`);
  const day = when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return timeValue ? `${day}, ${when.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}` : day;
}

/* Orders needed inside these hours (every day) are placed normally; any other time moves to the Customise form. Keep in step with the Visit page. */
const ACTIVE_HOURS = [6, 22];
const clock = hour => `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
const ACTIVE_RANGE = `${clock(ACTIVE_HOURS[0])} to ${clock(ACTIVE_HOURS[1])}`;

function outsideActiveHours(timeValue) {
  if (!timeValue) return false;
  const [hours, minutes] = timeValue.split(':').map(Number);
  const total = hours * 60 + minutes;
  return total < ACTIVE_HOURS[0] * 60 || total > ACTIVE_HOURS[1] * 60;
}

function slotProblem(dateValue, timeValue) {
  if (!dateValue || !timeValue) return '';
  const when = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(when.getTime())) return '';
  return when < new Date() ? 'Please choose a date and time in the future.' : '';
}

function checkSlot(form) {
  const time = form.elements.time;
  if (time) time.setCustomValidity(slotProblem(form.elements.needed.value, time.value));
}

function updateAfterHours() {
  $('#after-hours').hidden = !outsideActiveHours(orderForm.elements.time.value);
}

/* Moves the bag and every order detail (contact, location, pick-up, date and time) into the Customise form. */
function moveOrderToCustom() {
  const field = name => orderForm.elements[name].value;
  const quantity = [...cart.values()].reduce((sum, count) => sum + count, 0);
  const notes = field('notes').trim();
  const set = (name, value) => { customForm.elements[name].value = value; };
  set('name', field('name'));
  set('phone', field('phone'));
  set('email', field('email'));
  set('address', field('address'));
  set('delivery', field('delivery'));
  set('needed', field('needed'));
  set('time', field('time'));
  set('item', 'Something else');
  set('quantity', `${quantity} ${quantity === 1 ? 'item' : 'items'}, ${money(orderTotal())} total`);
  set('details', `Items from my bag:\n${itemLines().join('\n')}\nTotal: ${money(orderTotal())}${notes ? `\n\nNotes: ${notes}` : ''}`);
  if (orderForm.dataset.lat) {
    customForm.dataset.lat = orderForm.dataset.lat;
    customForm.dataset.lng = orderForm.dataset.lng;
    $('[data-locate-status]', customForm).textContent = 'Location copied from your order.';
  } else {
    delete customForm.dataset.lat;
    delete customForm.dataset.lng;
    $('[data-locate-status]', customForm).textContent = '';
  }
  customForm.dataset.fromOrder = '1';
  customForm.classList.remove('was-validated');
  checkSlot(customForm);
  showFormStatus(customForm, 'ok', `That time is outside our active hours (${ACTIVE_RANGE}), so we've moved your order here as a custom order with all your details filled in. Please check it, change anything you like, then send it.`);
  cartDialog.close();
  location.hash = 'custom-order';
}

function finishOrderHandoff() {
  if (!customForm.dataset.fromOrder) return;
  delete customForm.dataset.fromOrder;
  cart.clear();
  renderCart();
  orderForm.reset();
  delete orderForm.dataset.lat;
  delete orderForm.dataset.lng;
  updateAfterHours();
}

function validateForm(form) {
  form.classList.add('was-validated');
  $$('input[type="tel"]', form).forEach(input => input.setCustomValidity(input.value && !normalizePhone(input.value) ? 'Please enter a 10-digit mobile number.' : ''));
  checkSlot(form);
  return form.reportValidity();
}

const deliveryText = value => (value === 'pickup' ? "I'll pick it up myself" : "I'll arrange my own delivery");

function readForm(form) {
  const values = Object.fromEntries(new FormData(form));
  const read = key => singleLine(values[key]);
  const longText = key => String(values[key] ?? '').trim();
  return {
    name: read('name'), phone: normalizePhone(values.phone) || read('phone'), address: read('address'), email: read('email'),
    item: read('item'), topic: read('topic'), delivery: values.delivery, required: formatRequired(values.needed, values.time),
    quantity: read('quantity'), details: longText('details'), notes: longText('notes'), message: longText('message'), website: read('website'),
    coords: form.dataset.lat ? { lat: form.dataset.lat, lng: form.dataset.lng } : null
  };
}

const mapLink = data => (data.coords ? `https://www.google.com/maps?q=${data.coords.lat},${data.coords.lng}` : '');
const optionalFields = data => ({ ...(data.email ? { email: data.email } : {}), ...(data.coords ? { map_pin: mapLink(data) } : {}) });
const itemLines = () => orderRows().flatMap(({ product, quantity, amount }, index) => [
  `${index + 1}. ${product.name}`,
  `   ${product.description}`,
  `   Qty: ${quantity} x ${money(product.price)} = ${money(amount)}`
]);

function contactLines(data, bold) {
  const b = label => (bold ? `*${label}*` : label);
  return [
    `${b('Name')}: ${data.name}`,
    `${b('Phone')}: ${data.phone}`,
    ...(data.email ? [`${b('Email')}: ${data.email}`] : []),
    ...(data.address ? [`${b('Location')}: ${data.address}`] : []),
    ...(data.coords ? [`${b('Map pin')}: ${mapLink(data)}`] : [])
  ];
}

function orderMessage(data, bold) {
  const b = label => (bold ? `*${label}*` : label);
  return [
    `Hi ${CONFIG.brand}! I'd like to place an order.`, '',
    b('Order'),
    ...itemLines(),
    `${b('Total')}: ${money(orderTotal())}`, '',
    ...contactLines(data, bold),
    `${b('Pick-up / delivery')}: ${deliveryText(data.delivery)}`,
    `${b('Required on')}: ${data.required}`,
    ...(data.notes ? [`${b('Notes')}: ${data.notes}`] : []),
    '', 'Please confirm availability, payment and when it will be ready. Thank you!'
  ].join('\n');
}

function customMessage(data, bold) {
  const b = label => (bold ? `*${label}*` : label);
  return [
    `Hi ${CONFIG.brand}! I'd like to place a custom order.`, '',
    `${b('Item')}: ${data.item}`,
    `${b('Details')}: ${data.details}`,
    ...(data.quantity ? [`${b('Quantity / size')}: ${data.quantity}`] : []),
    `${b('Required on')}: ${data.required}`,
    ...contactLines(data, bold),
    `${b('Pick-up / delivery')}: ${deliveryText(data.delivery)}`,
    '', 'Please let me know if this is possible and the price. Thank you!'
  ].join('\n');
}

function openLink(url, newTab) {
  const link = document.createElement('a');
  link.href = url;
  if (newTab) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  document.body.append(link);
  link.click();
  link.remove();
}

/* Delivers a message to the owner's inbox through FormSubmit (it only works from http(s) pages, and the owner must click its one-time activation email). */
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONFIG.email}`;

async function emailToOwner(form, fields) {
  if (location.protocol === 'file:') return { ok: false, reason: 'file' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(form.action || FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _captcha: 'false', _template: 'table', _honey: '', ...fields }),
      signal: controller.signal
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && String(result.success) === 'true') return { ok: true };
    const message = String(result.message || '');
    console.warn('Email service:', message || response.status);
    return { ok: false, reason: /activation/i.test(message) ? 'activation' : /web ?server/i.test(message) ? 'file' : 'rejected' };
  } catch (error) {
    console.error('Form error:', error);
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

async function withBusy(button, task) {
  const label = $('span', button) || button;
  const original = label.textContent;
  button.disabled = true;
  label.textContent = 'Sending...';
  try {
    return await task();
  } finally {
    button.disabled = false;
    label.textContent = original;
  }
}

function showFormStatus(form, type, text, actions = []) {
  const box = $('.form-status', form);
  box.className = `form-status ${type}`;
  const message = document.createElement('p');
  message.textContent = text;
  box.replaceChildren(message);
  if (actions.length) {
    const row = document.createElement('div');
    row.className = 'status-actions';
    actions.forEach(({ label, href, newTab }) => {
      const link = document.createElement('a');
      link.className = 'chip-button';
      link.href = href;
      link.textContent = label;
      if (newTab) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      row.append(link);
    });
    box.append(row);
  }
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
}

const clearFormStatus = form => { const box = $('.form-status', form); if (box) box.hidden = true; };

function emailFailureText(reason) {
  if (reason === 'file') return 'Direct email only works when the website is online. Please tap the WhatsApp button below to message us directly, or open your email app.';
  if (reason === 'activation') return "We couldn't send your request right now. Please tap the WhatsApp button below to message us directly.";
  return "Your request couldn't be sent. Please tap the WhatsApp button below to message us directly, or try again.";
}

const fallbackActions = (whatsappText, subject, body) => [
  { label: 'Send on WhatsApp', href: waLink(whatsappText), newTab: true },
  { label: 'Open my email app', href: mailLink(subject, body) }
];

function renderOrderSummary() {
  const cell = (tag, className, text) => Object.assign(document.createElement(tag), { className, textContent: text });
  $('#order-lines').replaceChildren(...orderRows().map(({ product, quantity, amount }) => {
    const item = document.createElement('li');
    item.append(
      cell('span', 'line-name', product.name),
      cell('b', 'line-total', money(amount)),
      cell('small', 'line-desc', product.description),
      cell('small', 'line-calc', `Qty ${quantity} \u00d7 ${money(product.price)} each`)
    );
    return item;
  }));
  $('#order-total').textContent = money(orderTotal());
}

function showOrderSent(channel) {
  const lead = {
    whatsapp: 'We opened WhatsApp with your order filled in. Tap <strong>Send</strong> to place it.',
    email: 'We opened your email app with your order filled in. Press <strong>Send</strong> to place it.',
    emailed: 'Your order has been emailed to ANKRITA.'
  }[channel];
  const title = channel === 'emailed' ? 'Order sent!' : 'Your order is ready to send.';
  stepPanels.done.innerHTML = `<h3 tabindex="-1">${title}</h3><p>${lead}</p><p>Chef Anu will get in touch on the phone number you gave to confirm availability, payment and when it's ready. Please arrange your own delivery or collect it from us.</p><div class="form-actions"><button type="button" class="button" id="new-order"><span>Start a new order</span></button><button type="button" class="button button-ghost" id="edit-order"><span>Back to my order</span></button></div>`;
  setStep('done');
  $('h3', stepPanels.done).focus();
  confettiBurst();
}

async function sendOrder(channel) {
  clearFormStatus(orderForm);
  if (!cart.size || !validateForm(orderForm)) return;
  const data = readForm(orderForm);
  if (data.website) return;
  if (outsideActiveHours(orderForm.elements.time.value)) return moveOrderToCustom();
  if (channel === 'whatsapp') {
    openLink(waLink(orderMessage(data, true)), true);
    return showOrderSent('whatsapp');
  }
  const subject = `New order from ${data.name} (${money(orderTotal())})`;
  const text = orderMessage(data, false);
  const result = await withBusy($('#send-email'), () => emailToOwner(orderForm, { _subject: subject, name: data.name, phone: data.phone, ...optionalFields(data), address: data.address, pickup_method: deliveryText(data.delivery), required_on: data.required, items: itemLines().join('\n'), total: money(orderTotal()), notes: data.notes || '-' }));
  if (result.ok) return showOrderSent('emailed');
  showFormStatus(orderForm, 'error', emailFailureText(result.reason), fallbackActions(orderMessage(data, true), subject, text));
}

async function sendCustom(channel) {
  clearFormStatus(customForm);
  if (!validateForm(customForm)) return;
  const data = readForm(customForm);
  if (data.website) return;
  if (channel === 'whatsapp') {
    openLink(waLink(customMessage(data, true)), true);
    finishOrderHandoff();
    return showFormStatus(customForm, 'ok', 'Opening WhatsApp with your request filled in. Tap send there to place it.');
  }
  const subject = `Custom order request: ${data.item} (${data.name})`;
  const text = customMessage(data, false);
  const result = await withBusy($('#custom-email'), () => emailToOwner(customForm, { _subject: subject, name: data.name, phone: data.phone, ...optionalFields(data), item: data.item, details: data.details, quantity_or_size: data.quantity || '-', required_on: data.required, pickup_method: deliveryText(data.delivery), address: data.address || '-' }));
  if (!result.ok) return showFormStatus(customForm, 'error', emailFailureText(result.reason), fallbackActions(customMessage(data, true), subject, text));
  customForm.reset();
  customForm.classList.remove('was-validated');
  delete customForm.dataset.lat;
  delete customForm.dataset.lng;
  finishOrderHandoff();
  showFormStatus(customForm, 'ok', 'Sent! Chef Anu will get back to you on the phone number you gave.');
}

async function fetchJson(url, ms = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/* Tries OpenStreetMap first, then BigDataCloud's keyless client endpoint. */
async function reverseGeocode(lat, lng) {
  try {
    const place = await fetchJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&accept-language=en`);
    if (place.display_name) return singleLine(place.display_name);
  } catch { /* try the next service */ }
  try {
    const place = await fetchJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    return [...new Set([place.locality, place.city, place.principalSubdivision, place.postcode].filter(Boolean))].join(', ');
  } catch { /* fall back to coordinates */ }
  return '';
}

const getPosition = options => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));

function locationErrorText(error) {
  const online = location.protocol === 'file:' || !window.isSecureContext ? ' Location works best when the website is opened online (https).' : '';
  if (error?.code === 1) return 'Location access is blocked. Click the lock icon next to the web address, allow Location, then try again. Or just type your address.' + online;
  if (error?.code === 3) return 'Finding your location took too long. Please try again, or type your address.' + online;
  return "Your device couldn't work out its location. Check that location is switched on, or type your address." + online;
}

async function locate(button) {
  const form = button.closest('form');
  const status = $('[data-locate-status]', form);
  if (!navigator.geolocation) {
    status.textContent = 'Location is not available in this browser. Please type your address.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Finding your location... please allow location access if your browser asks.';
  try {
    let position;
    try {
      position = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    } catch (error) {
      if (error.code === 1) throw error;
      status.textContent = 'Still looking, trying a more precise fix...';
      position = await getPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    }
    const lat = position.coords.latitude.toFixed(5);
    const lng = position.coords.longitude.toFixed(5);
    form.dataset.lat = lat;
    form.dataset.lng = lng;
    form.elements.address.value = (await reverseGeocode(lat, lng)) || `Near ${lat}, ${lng}`;
    status.textContent = 'Location added. Please check it and add your flat number or landmark.';
  } catch (error) {
    status.textContent = locationErrorText(error);
  } finally {
    button.disabled = false;
  }
}

$('#checkout').addEventListener('click', () => {
  if (!cart.size) return;
  renderOrderSummary();
  setStep('order');
  orderForm.elements.name.focus();
});
$('#back-to-bag').addEventListener('click', () => setStep('bag'));
$('#send-email').addEventListener('click', () => sendOrder('email'));
orderForm.addEventListener('submit', event => { event.preventDefault(); sendOrder('whatsapp'); });
$('#custom-email').addEventListener('click', () => sendCustom('email'));
customForm.addEventListener('submit', event => { event.preventDefault(); sendCustom('whatsapp'); });
helpForm.addEventListener('submit', async event => {
  event.preventDefault();
  clearFormStatus(helpForm);
  if (!validateForm(helpForm)) return;
  const data = readForm(helpForm);
  if (data.website) return;
  const subject = `${data.topic} - ${data.name}`;
  const body = `${data.message}\n\nFrom: ${data.name} (${data.email})\nTopic: ${data.topic}`;
  const result = await withBusy($('button[type="submit"]', helpForm), () => emailToOwner(helpForm, { _subject: subject, name: data.name, email: data.email, topic: data.topic, message: data.message }));
  if (!result.ok) return showFormStatus(helpForm, 'error', emailFailureText(result.reason), fallbackActions(`Hi ${CONFIG.brand}! ${data.topic}\n\n${data.message}\n\n- ${data.name}`, subject, body));
  helpForm.reset();
  helpForm.classList.remove('was-validated');
  showFormStatus(helpForm, 'ok', 'Thank you! Your message was sent to ANKRITA.');
});
$$('[data-open-help]').forEach(button => button.addEventListener('click', () => {
  lastHelpTrigger = button;
  helpDialog.showModal();
  helpForm.elements.name.focus();
}));
$('#close-help').addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('close', () => lastHelpTrigger?.focus());
$$('[data-locate]').forEach(button => button.addEventListener('click', () => locate(button)));
[orderForm, customForm, helpForm].forEach(form => { form.action = FORM_ENDPOINT; });

document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement) event.target.classList.add('image-unavailable');
}, true);

addEventListener('hashchange', () => route());
addEventListener('scroll', queueFrame, { passive: true });
addEventListener('resize', () => {
  if (innerWidth > 1020) closeNavigation();
  movePill($('a[aria-current]', nav));
  queueFrame();
});
reducedQuery.addEventListener('change', () => {
  collectScrub();
  observeReveals();
  queueFrame();
});

/* ---------- Init ---------- */
$('#featured-products').innerHTML = featuredIds.map(byId).map(productMarkup).join('');
$('#daily-menu').innerHTML = dailyIds.map(byId).map((product, index) => `<li class="reveal" style="--delay:${index * 90}ms"><span class="name">${product.name}</span><span class="price">${money(product.price)}</span><button type="button" class="add" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button></li>`).join('');
$$('[data-split]').forEach(splitText);
$('#year').textContent = new Date().getFullYear();
$$('[data-whatsapp]').forEach(link => { link.href = waLink(link.dataset.whatsapp); });
$$('[data-email]').forEach(link => { link.href = `mailto:${CONFIG.email}`; link.textContent = CONFIG.email; });
$$('input[type="date"]').forEach(input => { input.min = new Date().toLocaleDateString('en-CA'); });
setStep('bag');
renderProducts();
renderCart();
route(true);
document.fonts?.ready.then(() => movePill($('a[aria-current]', nav)));
