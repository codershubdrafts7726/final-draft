document.addEventListener('DOMContentLoaded', function(){
    // Active nav highlight
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(a=>{ if(a.getAttribute('href')===path) a.classList.add('active'); });

    // Accordion for announcements
    document.querySelectorAll('.acc-header').forEach(h=>{
        h.addEventListener('click', ()=>{
            const body = h.parentElement.querySelector('.acc-body');
            const isOpen = body.style.display === 'block';
            
            // Close all other open items
            document.querySelectorAll('.acc-body').forEach(b=>b.style.display='none');
            
            // Toggle the clicked item
            if(!isOpen) body.style.display = 'block';

            // Also manage the '+' sign if needed in your CSS (not visible in JS)
            document.querySelectorAll('.acc-item').forEach(item => item.classList.remove('active'));
            if (!isOpen) h.parentElement.classList.add('active');
        });
    });

    // Drawer toggle (mobile)
    const hamburger = document.querySelector('.hamburger');
    const drawer = document.querySelector('.drawer');
    const backdrop = document.querySelector('.drawer-backdrop');
    if(hamburger && drawer && backdrop){
        const toggleDrawer = (open) => {
            if (open) {
                drawer.classList.add('open'); 
                backdrop.classList.add('open'); 
                drawer.setAttribute('aria-hidden','false'); 
                backdrop.setAttribute('aria-hidden','false');
            } else {
                drawer.classList.remove('open'); 
                backdrop.classList.remove('open'); 
                drawer.setAttribute('aria-hidden','true'); 
                backdrop.setAttribute('aria-hidden','true');
            }
        };

        hamburger.addEventListener('click', ()=>{ toggleDrawer(true); });
        backdrop.addEventListener('click', ()=>{ toggleDrawer(false); });
        document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ toggleDrawer(false); }});
    }

    // Demo search button (homepage)
    const searchBtn = document.getElementById('searchBtn');
    const searchBox = document.getElementById('searchBox');
    if(searchBtn && searchBox){
        searchBtn.addEventListener('click', ()=>{
            alert('Search is demo-only. Replace with OPAC integration.');
        });
    }

    // Books search on books page
    const booksSearch = document.getElementById('booksSearch');
    if(booksSearch){
        booksSearch.addEventListener('input', function(e){
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#booksTable tbody tr').forEach(tr=>{
                tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }

    // --- NEW: Email Fallback (This handles the scenario where mailto: fails) ---
    // If the mailto: link fails to open, this ensures the user can still get the email address.
    document.querySelectorAll('a[href^="mailto:"]').forEach(emailLink => {
        emailLink.addEventListener('click', (e) => {
            // Get the raw email address from the href attribute
            const email = emailLink.getAttribute('href').replace('mailto:', '');

            // Use a short delay before the fallback to give the mailto: link time to fire
            setTimeout(() => {
                // If the user's email client hasn't launched (which is the user-side issue),
                // we provide the email address via an alert.
                if (e.defaultPrevented === false) { 
                    alert(`If your email client did not launch, you can manually use this address: ${email}`);
                }
            }, 500); // 500ms delay
        });
    });
});

// Dynamic content loader: fetch /content/data.json and render on specific pages
async function loadSiteData(){
  try {
    const res = await fetch('/content/data.json');
    if(!res.ok) return;
    const data = await res.json();
    // Announcements page
    const annContainer = document.getElementById('announcements-container');
    if(annContainer && data.announcements){
      annContainer.innerHTML = '';
      data.announcements.forEach(a=>{
        const item = document.createElement('div');
        item.className = 'acc-item';
        item.innerHTML = `<div class="acc-header">${escapeHtml(a.title)}</div><div class="acc-body">${escapeHtml(a.body)}</div>`;
        annContainer.appendChild(item);
      });
      // reattach accordion toggles
      document.querySelectorAll('.acc-header').forEach(h=>{
        h.addEventListener('click', ()=>{
          const body = h.parentElement.querySelector('.acc-body');
          const isOpen = body.style.display === 'block';
          document.querySelectorAll('.acc-body').forEach(b=>b.style.display='none');
          if(!isOpen) body.style.display = 'block';
        });
      });
    }

    // Staff page
    const staffGrid = document.getElementById('staff-grid');
    if(staffGrid && data.staff){
      staffGrid.innerHTML = '';
      data.staff.forEach(s=>{
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div style="font-weight:700">${escapeHtml(s.name)}</div><div style="color:var(--muted)">${escapeHtml(s.role)}</div>`;
        staffGrid.appendChild(card);
      });
    }

    // Books page
    const booksList = document.getElementById('books-list');
    if(booksList && data.books){
      booksList.innerHTML = '<div class="cards"></div>';
      const container = booksList.querySelector('.cards');
      data.books.forEach(b=>{
        const c = document.createElement('div');
        c.className = 'card';
        c.innerHTML = `<div style="font-weight:700">${escapeHtml(b.title)}</div><div style="color:var(--muted)">${escapeHtml(b.author||'')}</div>`;
        container.appendChild(c);
      });
    }

    // E-resources page
    const erList = document.getElementById('eresources-list');
    if(erList && data.eresources){
      erList.innerHTML = '';
      data.eresources.forEach(r=>{
        const li = document.createElement('div');
        li.className='card';
        li.innerHTML = `<div style="font-weight:700"><a href="${escapeAttr(r.link)}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a></div><div style="color:var(--muted)">${escapeHtml(r.description||'')}</div>`;
        erList.appendChild(li);
      });
    }

  } catch(err){
    console.error('Failed to load site data', err);
  }
}

// small helpers
function escapeHtml(str){ if(!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeAttr(str){ if(!str) return ''; return str.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

document.addEventListener('DOMContentLoaded', function(){
  // call loader after initial scripts
  loadSiteData();
});
