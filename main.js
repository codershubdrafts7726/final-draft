/* main.js — revised
   - Single DOMContentLoaded handler
   - Robust nav active detection (handles absolute/relative links)
   - Event-delegated accordion (no double-binding; works with dynamic content)
   - Stable mobile drawer with backdrop, ARIA, ESC key, and smooth close+navigate
   - Dynamic loader with XSS-safe escaping helpers
*/
(function () {
  'use strict';

  /* ----------------------
     Helper utilities
  ---------------------- */
  function isExternalHref(href) {
    // treat mailto:, tel:, and absolute hostnames that are not this origin as external
    if (!href) return false;
    try {
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return true;
      const url = new URL(href, location.href);
      return url.origin !== location.origin;
    } catch (e) {
      // if URL parsing fails, treat as internal (relative) link
      return false;
    }
  }

  function normalizePath(raw) {
    // Normalize a path or href to a comparable pathname form:
    // - remove query/hash, convert index.html -> '/'
    // - ensure it starts with '/'
    if (!raw) return '/';
    try {
      // If raw is an absolute URL, extract pathname
      const u = new URL(raw, location.href);
      raw = u.pathname;
    } catch (e) {
      // leave raw as-is for relative paths
    }
    // strip query/hash if present (in case someone passed full href)
    raw = raw.split('?')[0].split('#')[0];

    if (!raw.startsWith('/')) raw = '/' + raw;
    // map '/index.html' or '/something/index.html' -> '/'
    raw = raw.replace(/\/index\.html$/i, '/');
    // trim trailing slash except root
    if (raw !== '/' && raw.endsWith('/')) raw = raw.slice(0, -1);
    return raw;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ----------------------
     Main initialization
  ---------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    // ---------- 1) Active nav highlight ----------
    try {
      const current = normalizePath(location.pathname + location.search + location.hash);
      document.querySelectorAll('.nav a, .drawer-menu a').forEach(a => {
        try {
          a.classList.remove('active');
          const href = a.getAttribute('href');
          if (!href || isExternalHref(href)) return; // skip external links
          const linkNorm = normalizePath(href);
          // Exact or "endsWith" match (so '/about' matches '/folder/about' if that is desired)
          if (current === linkNorm || current.endsWith(linkNorm)) {
            a.classList.add('active');
          }
        } catch (e) { /* ignore single-link failures */ }
      });
    } catch (e) {
      console.warn('Nav highlight failed', e);
    }

    // ---------- 2) Drawer (mobile) ----------
    const hamburger = document.querySelector('.hamburger');
    const drawer = document.querySelector('.drawer');
    const backdrop = document.querySelector('.drawer-backdrop');
    if (hamburger && drawer && backdrop) {
      // set initial ARIA states
      drawer.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');

      const TRANSITION_MS = 300; // matches CSS transition duration

      const openDrawer = () => {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // focus first focusable element in drawer for accessibility
        const firstFocus = drawer.querySelector('a, button, input, [tabindex]');
        if (firstFocus) firstFocus.focus();
      };

      const closeDrawer = () => {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        // delay flipping aria-hidden until after animation to avoid screen reader jumpiness
        setTimeout(() => {
          drawer.setAttribute('aria-hidden', 'true');
          backdrop.setAttribute('aria-hidden', 'true');
        }, TRANSITION_MS);
        document.body.style.overflow = '';
      };

      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });

      backdrop.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
      });

      // Smooth-close + navigate for drawer links
      document.querySelectorAll('.drawer-menu a').forEach(link => {
        link.addEventListener('click', (evt) => {
          const href = link.getAttribute('href');
          // if external/mailer or has target=_blank, just let it work
          if (!href || isExternalHref(href) || link.target === '_blank') {
            closeDrawer();
            return;
          }
          evt.preventDefault();
          closeDrawer();
          setTimeout(() => { window.location.href = link.href; }, TRANSITION_MS + 20);
        });
      });
    }

    // ---------- 3) Event-delegated Accordion (works for dynamic content) ----------
    // Use delegation: listen on body and react to clicks on .acc-header
    document.body.addEventListener('click', function (evt) {
      const header = evt.target.closest('.acc-header');
      if (!header) return;
      // find the acc-item container
      const item = header.closest('.acc-item');
      if (!item) return;
      const bodyEl = item.querySelector('.acc-body');
      const iconSpan = header.querySelector('span');
      if (!bodyEl) return;

      const isOpen = bodyEl.style.display === 'block';

      // Close all siblings within the same parent container (so separate accordions don't interfere)
      const parent = item.parentElement || document;
      parent.querySelectorAll('.acc-item').forEach(it => {
        const b = it.querySelector('.acc-body');
        if (b) b.style.display = 'none';
        it.classList.remove('active');
        const s = it.querySelector('.acc-header span');
        if (s) s.textContent = '+';
      });

      // Toggle target
      if (!isOpen) {
        bodyEl.style.display = 'block';
        item.classList.add('active');
        if (iconSpan) iconSpan.textContent = '−';
      } else {
        // if clicking an already-open header, close it
        bodyEl.style.display = 'none';
        item.classList.remove('active');
        if (iconSpan) iconSpan.textContent = '+';
      }
    });

    // ---------- 4) Search & small behaviors ----------
    // Demo search button (homepage)
    const searchBtn = document.getElementById('searchBtn');
    const searchBox = document.getElementById('searchBox');
    if (searchBtn && searchBox) {
      searchBtn.addEventListener('click', () => {
        alert('Search is demo-only. Replace with OPAC integration.');
      });
    }

    // Books search on books page
    const booksSearch = document.getElementById('booksSearch');
    if (booksSearch) {
      booksSearch.addEventListener('input', function (e) {
        const q = (e.target.value || '').toLowerCase();
        document.querySelectorAll('#booksTable tbody tr').forEach(tr => {
          tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    // Email Fallback
    document.querySelectorAll('a[href^="mailto:"]').forEach(emailLink => {
      emailLink.addEventListener('click', (e) => {
        const email = emailLink.getAttribute('href').replace('mailto:', '');
        setTimeout(() => {
          // If mailto didn't open a client (can't reliably detect), provide a fallback
          // Note: we avoid calling preventDefault so default behavior still attempts to open mail client
          alert(`If your email client did not launch, you can manually use this address: ${email}`);
        }, 500);
      });
    });

    // ---------- 5) Load dynamic content ----------
    // Call loader once at init (function defined below)
    loadSiteData().catch(err => console.error('loadSiteData error', err));
  }); // DOMContentLoaded end

  /* ----------------------
     Dynamic content loader
     (separate function so we can call it from elsewhere if needed)
  ---------------------- */
  async function loadSiteData() {
    try {
      const res = await fetch('/content/data.json', { cache: 'no-store' });
      if (!res || !res.ok) return;
      const data = await res.json();

      // Announcements
      const annContainer = document.getElementById('announcements-container');
      if (annContainer && Array.isArray(data.announcements)) {
        annContainer.innerHTML = '';
        data.announcements.forEach(a => {
          const item = document.createElement('div');
          item.className = 'acc-item';
          item.innerHTML = `<div class="acc-header">${escapeHtml(a.title || '')} <span style="color:var(--muted)">+</span></div><div class="acc-body">${escapeHtml(a.body || '')}</div>`;
          annContainer.appendChild(item);
        });
        // No manual re-binding required because we use delegation
      }

      // Staff
      const staffGrid = document.getElementById('staff-grid');
      if (staffGrid && Array.isArray(data.staff)) {
        staffGrid.innerHTML = '';
        data.staff.forEach(s => {
          const card = document.createElement('div');
          card.className = 'staff-card';
          card.innerHTML = `<div style="font-weight:700">${escapeHtml(s.name || '')}</div><div style="color:var(--muted)">${escapeHtml(s.role || '')}</div>`;
          staffGrid.appendChild(card);
        });
      }

      // Books
      const booksList = document.getElementById('books-list');
      if (booksList && Array.isArray(data.books)) {
        booksList.innerHTML = '<div class="cards" aria-live="polite"></div>';
        const container = booksList.querySelector('.cards');
        data.books.forEach(b => {
          const c = document.createElement('div');
          c.className = 'card';
          c.innerHTML = `<div style="font-weight:700">${escapeHtml(b.title || '')}</div><div style="color:var(--muted)">${escapeHtml(b.author || '')}</div>`;
          container.appendChild(c);
        });
      }

      // E-resources
      const erList = document.getElementById('eresources-list');
      if (erList && Array.isArray(data.eresources)) {
        erList.innerHTML = '';
        data.eresources.forEach(r => {
          const li = document.createElement('div');
          li.className = 'card';
          li.innerHTML = `<div style="font-weight:700"><a href="${escapeAttr(r.link || '#')}" target="_blank" rel="noopener">${escapeHtml(r.title || '')}</a></div><div style="color:var(--muted)">${escapeHtml(r.description || '')}</div>`;
          erList.appendChild(li);
        });
      }

    } catch (err) {
      console.error('Failed to load site data', err);
    }
  }

  // Expose loader in case you want to manually call it from console
  window.loadSiteData = loadSiteData;
})();
