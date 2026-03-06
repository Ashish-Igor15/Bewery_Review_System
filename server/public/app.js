const state = {
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  selectedBreweryId: null,
  searchResults: [],
};

const authInfo = document.getElementById('authInfo');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');

const searchForm = document.getElementById('searchForm');
const searchMessage = document.getElementById('searchMessage');
const results = document.getElementById('results');

const breweryDetailSection = document.getElementById('breweryDetailSection');
const breweryDetail = document.getElementById('breweryDetail');
const reviewsList = document.getElementById('reviewsList');
const reviewForm = document.getElementById('reviewForm');
const reviewMessage = document.getElementById('reviewMessage');
const backToResultsBtn = document.getElementById('backToResultsBtn');

function setMessage(el, message, isError = false) {
  el.textContent = message;
  el.classList.toggle('error', isError);
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
}

function updateAuthUI() {
  if (state.user) {
    authInfo.textContent = `Logged in as ${state.user.email}`;
    logoutBtn.hidden = false;
  } else {
    authInfo.textContent = 'Not logged in';
    logoutBtn.hidden = true;
  }
}

function createInfoLine(label, value) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;
  p.appendChild(strong);
  p.appendChild(document.createTextNode(value));
  return p;
}

function createWebsiteLine(url) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = 'Website: ';
  p.appendChild(strong);

  if (!url) {
    p.appendChild(document.createTextNode('N/A'));
    return p;
  }

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = url;
  p.appendChild(link);
  return p;
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

async function syncCurrentUser() {
  if (!state.token) return;

  try {
    const data = await apiRequest('/api/auth/me');
    state.user = data.user;
    localStorage.setItem('user', JSON.stringify(state.user));
  } catch (error) {
    state.token = '';
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

async function handleAuth(mode) {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const activeButton = mode === 'signup' ? signupBtn : loginBtn;

  try {
    setButtonLoading(activeButton, true, mode === 'signup' ? 'Signing up...' : 'Logging in...');
    setMessage(authMessage, '');

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (mode === 'signup') {
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setMessage(authMessage, data.message || 'Signup successful. Please login.');
      return;
    }

    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    state.token = data.token;
    state.user = data.user;

    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));

    updateAuthUI();
    setMessage(authMessage, 'Login successful');
  } catch (error) {
    setMessage(authMessage, error.message, true);
  } finally {
    setButtonLoading(activeButton, false);
  }
}

function renderResults(items) {
  results.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No breweries found for this search.';
    results.appendChild(empty);
    return;
  }

  items.forEach((brewery) => {
    const card = document.createElement('div');
    card.className = 'brewery-card';

    const title = document.createElement('h4');
    title.textContent = brewery.name || 'Unknown Brewery';

    const address = document.createElement('p');
    address.textContent = `${brewery.address_1 || brewery.street || 'N/A'}, ${brewery.city || 'N/A'}, ${brewery.state || brewery.state_province || 'N/A'}`;

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `Phone: ${brewery.phone || 'N/A'} | Website: `;
    if (brewery.website_url) {
      const link = document.createElement('a');
      link.href = brewery.website_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Visit';
      meta.appendChild(link);
    } else {
      meta.appendChild(document.createTextNode('N/A'));
    }

    const rating = document.createElement('p');
    rating.className = 'meta';
    rating.textContent = `Current Rating: ${brewery.current_rating ?? 'No ratings yet'} (${brewery.review_count || 0} review${brewery.review_count === 1 ? '' : 's'})`;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'View Details';
    button.addEventListener('click', () => openBreweryDetails(brewery.id));

    card.append(title, address, meta, rating, button);
    results.appendChild(card);
  });
}

function renderReviews(reviews) {
  reviewsList.innerHTML = '';

  if (!reviews.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No reviews yet. Be the first to review.';
    reviewsList.appendChild(empty);
    return;
  }

  reviews.forEach((review) => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const rating = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${'⭐'.repeat(review.rating)} (${review.rating}/5)`;
    rating.appendChild(strong);

    const description = document.createElement('p');
    description.textContent = review.description;

    const meta = document.createElement('p');
    meta.className = 'meta';
    const by = review.user?.email || 'Unknown';
    const when = review.createdAt ? new Date(review.createdAt).toLocaleString() : 'Unknown time';
    meta.textContent = `By: ${by} | ${when}`;

    card.append(rating, description, meta);
    reviewsList.appendChild(card);
  });
}

async function openBreweryDetails(id) {
  try {
    setMessage(reviewMessage, '');
    const data = await apiRequest(`/api/breweries/${id}`);

    state.selectedBreweryId = id;
    breweryDetailSection.hidden = false;

    const b = data.brewery;
    breweryDetail.innerHTML = '';
    breweryDetail.append(
      createInfoLine('Name', b.name || 'N/A'),
      createInfoLine('Address', `${b.address_1 || b.street || 'N/A'}, ${b.city || 'N/A'}, ${b.state || b.state_province || 'N/A'}`),
      createInfoLine('Phone', b.phone || 'N/A'),
      createWebsiteLine(b.website_url),
      createInfoLine('Type/Country', `${b.brewery_type || 'N/A'} / ${b.country || 'N/A'}`),
      createInfoLine('Current Rating', `${data.averageRating ?? 'No ratings yet'} (${data.reviewCount} review${data.reviewCount === 1 ? '' : 's'})`)
    );

    renderReviews(data.reviews || []);
    breweryDetailSection.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    setMessage(searchMessage, error.message, true);
  }
}

async function searchBreweries(event) {
  event.preventDefault();

  const submitBtn = searchForm.querySelector('button[type="submit"]');
  try {
    setButtonLoading(submitBtn, true, 'Searching...');
    const params = new URLSearchParams();

    ['by_city', 'by_name', 'by_type'].forEach((key) => {
      const value = document.getElementById(key).value.trim();
      if (value) params.set(key, value);
    });

    if (![...params.keys()].length) {
      throw new Error('Please provide at least one search filter.');
    }

    const data = await apiRequest(`/api/breweries/search?${params.toString()}`);
    state.searchResults = data.breweries || [];
    renderResults(state.searchResults);
    setMessage(searchMessage, `Found ${data.count || 0} breweries.`);
  } catch (error) {
    setMessage(searchMessage, error.message, true);
    results.innerHTML = '';
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function submitReview(event) {
  event.preventDefault();

  const submitBtn = reviewForm.querySelector('button[type="submit"]');
  try {
    setButtonLoading(submitBtn, true, 'Saving...');
    if (!state.token) {
      throw new Error('Please login to add a review.');
    }
    if (!state.selectedBreweryId) {
      throw new Error('Please open a brewery page first.');
    }

    const rating = Number(document.getElementById('rating').value);
    const description = document.getElementById('description').value.trim();

    await apiRequest(`/api/breweries/${state.selectedBreweryId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, description }),
    });

    setMessage(reviewMessage, 'Review saved successfully.');
    document.getElementById('description').value = '';
    document.getElementById('rating').value = '';
    await openBreweryDetails(state.selectedBreweryId);
  } catch (error) {
    setMessage(reviewMessage, error.message, true);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function logout() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  setMessage(authMessage, 'Logged out successfully.');
}

signupBtn.addEventListener('click', () => handleAuth('signup'));
loginBtn.addEventListener('click', () => handleAuth('login'));
logoutBtn.addEventListener('click', logout);
searchForm.addEventListener('submit', searchBreweries);
reviewForm.addEventListener('submit', submitReview);
backToResultsBtn.addEventListener('click', () => {
  breweryDetailSection.hidden = true;
  state.selectedBreweryId = null;
});

(async function init() {
  await syncCurrentUser();
  updateAuthUI();
})();
