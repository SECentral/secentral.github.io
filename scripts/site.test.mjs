import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../assets/js/site.js', import.meta.url), 'utf8');

test('diagram packets animate only while the fleet diagram is visible', () => {
  const observers = [];
  const classes = new Set();
  const diagram = { classList: {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    contains: (name) => classes.has(name),
  } };
  const svgs = [{ pauseCount: 0, resumeCount: 0, pauseAnimations() { this.pauseCount += 1; }, unpauseAnimations() { this.resumeCount += 1; } },
    { pauseCount: 0, resumeCount: 0, pauseAnimations() { this.pauseCount += 1; }, unpauseAnimations() { this.resumeCount += 1; } }];
  diagram.querySelectorAll = () => svgs;
  class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  runInNewContext(source, {
    window: { IntersectionObserver, matchMedia: () => ({ matches: false }) },
    IntersectionObserver,
    document: { querySelector: (selector) => selector === '.fleet-diagram' ? diagram : null },
  });
  const diagramObserver = observers.find((observer) => observer.target === diagram);
  assert.ok(svgs.every((svg) => svg.pauseCount === 1));
  diagramObserver.callback([{ isIntersecting: false }]);
  assert.equal(classes.size, 0);
  assert.ok(svgs.every((svg) => svg.pauseCount === 2));
  diagramObserver.callback([{ isIntersecting: true }]);
  assert.equal(classes.has('is-visible'), true);
  assert.ok(svgs.every((svg) => svg.resumeCount === 1));
});

test('reduced-motion preference keeps animated packets and control hidden', () => {
  let observed = false;
  class IntersectionObserver {
    observe() { observed = true; }
  }
  const diagram = { classList: { add() {}, remove() {} } };
  runInNewContext(source, {
    window: { IntersectionObserver, matchMedia: () => ({ matches: true }) },
    IntersectionObserver,
    document: { querySelector: (selector) => selector === '.fleet-diagram' ? diagram : null },
  });
  assert.equal(observed, false);
});

test('other pages and browsers without observers keep native anchor navigation', () => {
  assert.doesNotThrow(() => runInNewContext(source, { window: {}, document: { querySelector: () => null } }));
  assert.doesNotThrow(() => runInNewContext(source, {
    window: { IntersectionObserver: true },
    document: { querySelector: () => null },
  }));
});

test('screenshot gallery opens at the selected image and navigates with buttons and arrow keys', () => {
  const listeners = {};
  const dialogListeners = {};
  const image = {};
  const counter = {};
  const previous = { addEventListener: (type, handler) => { listeners.previous = handler; } };
  const next = { addEventListener: (type, handler) => { listeners.next = handler; } };
  const dialog = {
    opened: false,
    addEventListener: (type, handler) => { dialogListeners[type] = handler; },
    showModal() { this.opened = true; },
    close() { this.opened = false; },
    querySelector: (selector) => ({
      'figure img': image,
      figcaption: counter,
      '.screenshot-previous': previous,
      '.screenshot-next': next,
    })[selector],
  };
  const links = [
    { href: '/images/issue.webp', dataset: { galleryTitle: 'Issue detail' }, querySelector: () => ({ alt: 'Issue details' }), addEventListener: (type, handler) => { listeners.issue = handler; } },
    { href: '/images/host.webp', dataset: { galleryTitle: 'Host detail' }, querySelector: () => ({ alt: 'Host details' }), addEventListener: (type, handler) => { listeners.host = handler; } },
  ];
  runInNewContext(source, {
    window: {},
    document: {
      querySelector: (selector) => selector === '.screenshot-dialog' ? dialog : null,
      querySelectorAll: (selector) => selector === '.screenshot-link' ? links : [],
    },
  });
  let prevented = false;
  listeners.host({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(dialog.opened, true);
  assert.equal(image.src, '/images/host.webp');
  assert.equal(image.alt, 'Host details');
  assert.equal(counter.textContent, 'Host detail · 2 of 2');
  listeners.next();
  assert.equal(image.src, '/images/issue.webp');
  assert.equal(counter.textContent, 'Issue detail · 1 of 2');
  dialogListeners.keydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(image.src, '/images/host.webp');
  dialogListeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(image.src, '/images/issue.webp');
  dialogListeners.click({ target: dialog });
  assert.equal(dialog.opened, false);
});
