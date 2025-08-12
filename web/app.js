document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file');
  const promptInput = document.getElementById('prompt');
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const toastEl = document.getElementById('toast');
  const installBtn = document.getElementById('installBtn');
  const billingToggle = document.getElementById('billingToggle');
  const dropzone = document.getElementById('dropzone');
  const modalAuth = document.getElementById('modal-auth');
  const modalAuthRequired = document.getElementById('modal-auth-required');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authTabSignup = document.getElementById('auth-tab-signup');
  const authTabLogin = document.getElementById('auth-tab-login');
  let isSignedIn = false;
  let authToken = localStorage.getItem('auth_token');
  
  // Check if user is already signed in on page load
  if (authToken) {
    isSignedIn = true;
  }
  
  // Update UI based on auth status
  function updateAuthUI() {
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isSignedIn) {
      signupBtn?.style && (signupBtn.style.display = 'none');
      logoutBtn?.style && (logoutBtn.style.display = 'inline-block');
    } else {
      signupBtn?.style && (signupBtn.style.display = 'inline-block');
      logoutBtn?.style && (logoutBtn.style.display = 'none');
    }
  }
  
  // Initial UI update
  updateAuthUI();

// Modal helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('aria-hidden', 'false');
  el.style.display = 'grid';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('aria-hidden', 'true');
  el.style.display = 'none';
}
  window.openAuth = (mode = 'signup') => { setAuthMode(mode); openModal('modal-auth'); };
  window.closeModal = closeModal;
  window.logout = () => {
    localStorage.removeItem('auth_token');
    authToken = null;
    isSignedIn = false;
    toast('Signed out');
    updateAuthUI();
  };// Auth mode toggle
function setAuthMode(mode) {
  const isSignup = mode === 'signup';
  authTitle.textContent = isSignup ? 'Create account' : 'Log in';
  authTabSignup?.classList.toggle('active', isSignup);
  authTabLogin?.classList.toggle('active', !isSignup);
  const submit = document.getElementById('auth-submit');
  if (submit) submit.textContent = isSignup ? 'Create account' : 'Log in';
}
window.setAuthMode = setAuthMode;

  // Mock auth submit
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email')?.value?.trim();
    const pass = document.getElementById('auth-pass')?.value?.trim();
    if (!email || !pass) return;
    
    const isLogin = authTabLogin?.classList.contains('active');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      const data = await response.json();
      authToken = data.token;
      localStorage.setItem('auth_token', authToken);
      isSignedIn = true;
      closeModal('modal-auth');
      toast(isLogin ? 'Signed in successfully' : 'Account created successfully');
      updateAuthUI();
    } catch (error) {
      console.error('Auth error:', error);
      toast(error.message || 'Authentication failed', true);
    }
  });  // Dropzone interactions
  if (dropzone && fileInput) {
    // Click anywhere in dropzone to open file picker
    dropzone.addEventListener('click', () => fileInput.click());
    // Explicit handler for the Choose image button inside dropzone
    const chooseBtn = dropzone.querySelector('button[type="button"]');
    chooseBtn?.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    // Drag & drop
    ['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
    ['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
    dropzone.addEventListener('drop', (e) => {
      const f = e.dataTransfer?.files?.[0];
      if (f && f.type.startsWith('image/')) {
        fileInput.files = e.dataTransfer.files;
        toast('Image selected');
      } else {
        toast('Please drop an image file', true);
      }
    });
  }

  form?.addEventListener('submit', async (e) => {
  e.preventDefault();
    resultsEl.innerHTML = '';
    const file = fileInput.files?.[0];
    const prompt = promptInput.value || '';
  if (!file) {
      statusEl.textContent = 'Please select an image.';
    return;
  }
    // Gate analysis if not signed in
    if (!isSignedIn) {
      openModal('modal-auth-required');
      statusEl.textContent = 'Please sign in to analyze.';
      return;
    }
    statusEl.textContent = 'Analyzing...';
    // Disable the submit button specifically
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
  try {
      const upload = file;
      const fd = new FormData();
      fd.append('file', upload);
      fd.append('prompt', prompt);
      
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: headers,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    renderResults(data);
    statusEl.textContent = 'Done';
      toast('Recipes ready');
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error: ' + (err.message || 'unknown');
      toast('There was an error analyzing your image', true);
  } finally {
      const submitBtn2 = form.querySelector('button[type="submit"]');
      if (submitBtn2) submitBtn2.disabled = false;
  }
  });

function renderResults(data) {
  const { ingredients = [], recipes = [] } = data || {};
  const ing = document.createElement('div');
  ing.className = 'card';
  ing.innerHTML = `<h3>Detected ingredients</h3>`;
  const list = document.createElement('div');
  list.className = 'list';
  ingredients.forEach((x) => {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = x;
    list.appendChild(b);
  });
  ing.appendChild(list);
  resultsEl.appendChild(ing);

  recipes.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'card';
    const steps = (r.steps || []).map(s => `<li>${s}</li>`).join('');
    const ings = (r.ingredients || []).join(', ');
    card.innerHTML = `
      <h3>${r.title || 'Recipe'}</h3>
      <div><strong>Ingredients:</strong> ${ings}</div>
      <div><strong>Time:</strong> ${r.timeMins || '?'} mins</div>
      <ol>${steps}</ol>
    `;
    resultsEl.appendChild(card);
  });
}

// Pricing toggle (monthly <-> annual)
function updatePrices() {
  const annual = billingToggle?.checked;
  document.querySelectorAll('.price').forEach((el) => {
    const v = el.getAttribute(annual ? 'data-annual' : 'data-monthly') || '';
    el.textContent = v;
  });
  document.querySelectorAll('.period').forEach((el) => {
    el.textContent = annual ? '/yr' : '/mo';
  });
}
billingToggle?.addEventListener('change', updatePrices);
updatePrices?.();

// Toast utility
  function toast(message, isError = false, timeout = 2500) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  toastEl.style.borderColor = isError ? '#e06d06' : '';
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => (toastEl.style.display = 'none'), timeout);
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-block';
});
  installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') toast('App installed');
  deferredPrompt = null;
  installBtn.style.display = 'none';
  });
});
