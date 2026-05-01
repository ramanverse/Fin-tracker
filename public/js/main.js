const API_URL = '/api';

// Utility to set token
const setToken = (token) => {
  localStorage.setItem('finance_token', token);
};

const getToken = () => {
  return localStorage.getItem('finance_token');
};

const logout = () => {
  localStorage.removeItem('finance_token');
  window.location.href = '/';
};

// Check Auth on page load
const checkAuth = async () => {
  const token = getToken();
  
  // Extract token from URL if Google OAuth redirect
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  
  if (urlToken) {
    setToken(urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }

  if (!token) {
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.location.href = '/';
    }
    return false;
  }

  // Validate token
  try {
    const res = await fetch(`\${API_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer \${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error('Invalid token');
    
    // Redirect logged-in users away from login page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      window.location.href = '/dashboard.html';
    }
    return true;
  } catch (error) {
    logout();
    return false;
  }
};

// Generic Fetch wrapper with Auth header
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Authorization': `Bearer \${token}`,
    ...options.headers
  };
  
  // Don't set Content-Type for FormData (multer)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else {
    delete headers['Content-Type'];
  }

  const res = await fetch(`\${API_URL}\${endpoint}`, { ...options, headers });
  return await res.json();
};

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
});
