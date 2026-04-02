const API_URL = 'http://127.0.0.1:5000/api/v1';
let allPlaces = [];

const PLACE_IMAGES = {
    'cottage': 'images/FFXIV-Cottage.jpg',
    'lavender': 'images/FFXIV-Lavender Beds Manor.jpg',
    'goblet': 'images/FFXIV-Goblet Penthouse Suite.jpg',
    'coerthas': 'images/FFXIV-Coerthas Highland Retreat.jpg',
    'shirogane': 'images/FFXIV-Shirogane Riverside Inn.png',
    'mor dhona': 'images/FFXIV-Mor Dhona.png',
    'dravania': 'images/FFXIV-Dravania Sky Cabin.jpg',
    "rhalgr": "images/FFXIV-Rhalgr's Reach Lodging.jpg",
};

function getPlaceImage(title) {
    if (!title) return null;
    const lower = title.toLowerCase();
    for (const [keyword, img] of Object.entries(PLACE_IMAGES)) {
        if (lower.includes(keyword)) return img;
    }
    return null;
}

function getTokenPayload(token) {
    try {
        const base64url = token.split('.')[1];
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

function isAdmin(token) {
    const payload = getTokenPayload(token);
    return payload && payload.is_admin === true;
}

function getCurrentUserId(token) {
    const payload = getTokenPayload(token);
    return payload ? payload.sub : null;
}

function startTokenExpiryWatcher() {
    const token = getCookie('token');
    if (!token) return;

    const payload = getTokenPayload(token);
    if (!payload || !payload.exp) return;

    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const delay = expiresAt - now;

    if (delay <= 0) {
        logout();
        return;
    }

    setTimeout(() => {
        logout();
    }, delay);
}

function initLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<img id="lightbox-img" src="" alt="">';
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', () => lightbox.classList.remove('active'));

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('place-card-image') || e.target.classList.contains('place-detail-image')) {
            document.getElementById('lightbox-img').src = e.target.src;
            lightbox.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startTokenExpiryWatcher();
    initLightbox();

    if (document.getElementById('login-form')) {
        setupLoginForm();
    }

    if (document.getElementById('places-list')) {
        checkAuthenticationIndex();
        setupPriceFilter();
    }

    if (document.getElementById('place-details')) {
        initPlaceDetailsPage();
    }

    if (document.getElementById('add-review-section')) {
        initAddReviewPage();
    }

    if (document.getElementById('create-user-section')) {
        initCreateUserPage();
    }

    if (document.getElementById('create-place-section')) {
        initCreatePlacePage();
    }
});

function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith(`${name}=`)) {
            return trimmedCookie.substring(name.length + 1);
        }
    }

    return null;
}

/* =========================
   LOGIN
========================= */
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('error-message');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (errorMessage) {
            errorMessage.textContent = '';
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (errorMessage) {
                    errorMessage.textContent = data.error || 'Login failed.';
                }
                return;
            }

            if (!data.access_token) {
                if (errorMessage) {
                    errorMessage.textContent = 'No token returned by API.';
                }
                return;
            }

            document.cookie = `token=${data.access_token}; path=/`;
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            if (errorMessage) {
                errorMessage.textContent = 'Unable to connect to the server.';
            }
        }
    });
}

/* =========================
   INDEX
========================= */
function updateNavBar(token) {
    const loginLink = document.getElementById('login-link');
    const adminLink = document.getElementById('admin-link');
    const logoutLink = document.getElementById('logout-link');
    const createPlaceLink = document.getElementById('create-place-link');

    if (!token) {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
        if (createPlaceLink) createPlaceLink.style.display = 'none';
    } else {
        if (loginLink) loginLink.style.display = 'none';
        if (adminLink) adminLink.style.display = isAdmin(token) ? 'inline-block' : 'none';
        if (logoutLink) logoutLink.style.display = 'inline-block';
        if (createPlaceLink) createPlaceLink.style.display = 'inline-block';
    }
}

function logout() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = 'index.html';
}

function checkAuthenticationIndex() {
    const token = getCookie('token');
    updateNavBar(token);
    fetchPlaces(token);
}

async function fetchPlaces(token) {
    try {
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/places/`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch places');
        }

        const places = await response.json();
        allPlaces = places;
        displayPlaces(allPlaces);
    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    if (!placesList) {
        return;
    }

    placesList.innerHTML = '<h2>Available Estates</h2>';

    if (places.length === 0) {
        placesList.innerHTML += '<p style="color: #b0a890; text-align: center; width: 100%;">No estates found.</p>';
        return;
    }

    places.forEach((place) => {
        const placeCard = document.createElement('article');
        placeCard.className = 'place-card';
        placeCard.dataset.price = place.price;
        placeCard.dataset.region = getRegionFromDescription(place.description);

        const placeImage = getPlaceImage(place.title);
        placeCard.innerHTML = `
            ${placeImage ? `<img src="${placeImage}" alt="${place.title}" class="place-card-image">` : ''}
            <h3>${place.title}</h3>
            <p>${place.description ? place.description : 'No description available.'}</p>
            <p><strong>Gil per night:</strong> ${place.price} gil</p>
            <a href="place.html?id=${place.id}" class="details-button">View Details</a>
        `;

        placesList.appendChild(placeCard);
    });
}

function getRegionFromDescription(description) {
    if (!description) return '';
    const match = description.match(/^\[([^\]]+)\]/);
    if (match) return match[1];
    const regions = ['La Noscea', 'The Black Shroud', 'Thanalan', 'Coerthas', 'Mor Dhona', 'Abalathia', 'Dravania', 'Gyr Abania', 'Othard', 'Hingashi'];
    for (const region of regions) {
        if (description.includes(region)) return region;
    }
    return '';
}

function getFilteredPlaces() {
    const priceFilter = document.getElementById('price-filter');
    const regionFilter = document.getElementById('region-filter');

    const maxPrice = priceFilter && priceFilter.value !== 'all' ? parseFloat(priceFilter.value) : null;
    const region = regionFilter ? regionFilter.value : 'all';

    return allPlaces.filter((place) => {
        const priceOk = maxPrice === null || place.price <= maxPrice;
        const regionOk = region === 'all' || getRegionFromDescription(place.description) === region;
        return priceOk && regionOk;
    });
}

function setupPriceFilter() {
    const priceFilter = document.getElementById('price-filter');
    const regionFilter = document.getElementById('region-filter');

    if (priceFilter) {
        priceFilter.addEventListener('change', () => displayPlaces(getFilteredPlaces()));
    }

    if (regionFilter) {
        regionFilter.addEventListener('change', () => displayPlaces(getFilteredPlaces()));
    }
}

/* =========================
   PLACE DETAILS
========================= */
function initPlaceDetailsPage() {
    const token = getCookie('token');
    const addReviewSection = document.getElementById('add-review');
    const placeId = getPlaceIdFromURL();

    if (!placeId) {
        console.error('No place ID found in URL');
        return;
    }

    updateNavBar(token);

    if (addReviewSection) {
        addReviewSection.style.display = token ? 'block' : 'none';
    }

    fetchPlaceDetails(token, placeId);

    const reviewForm = document.getElementById('review-form');
    if (reviewForm && token) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const reviewText = document.getElementById('review-text').value.trim();
            const rating = parseInt(document.getElementById('rating').value, 10);

            try {
                const response = await submitReview(token, placeId, reviewText, rating);
                const data = await response.json();

                if (response.ok) {
                    alert('Review submitted successfully!');
                    reviewForm.reset();
                    fetchPlaceDetails(token, placeId);
                } else {
                    alert(data.error || 'Failed to submit review.');
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('Unable to connect to the server.');
            }
        });
    }
}

function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function fetchPlaceDetails(token, placeId) {
    try {
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/places/${placeId}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch place details');
        }

        const place = await response.json();
        displayPlaceDetails(place);
    } catch (error) {
        console.error('Error fetching place details:', error);
    }
}

function displayPlaceDetails(place) {
    const placeDetails = document.getElementById('place-details');
    const reviewsSection = document.getElementById('reviews');

    if (!placeDetails || !reviewsSection) {
        return;
    }

    const token = getCookie('token');
    const currentUserId = getCurrentUserId(token);
    const canDeletePlace = token && (isAdmin(token) || place.owner.id === currentUserId);

    const deleteBtn = document.getElementById('delete-place-btn');
    if (deleteBtn) {
        if (canDeletePlace) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.onclick = async () => {
                if (!confirm('Are you sure you want to delete this place?')) return;
                try {
                    const response = await fetch(`${API_URL}/places/${place.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        window.location.href = 'index.html';
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Failed to delete place.');
                    }
                } catch (error) {
                    alert('Unable to connect to the server.');
                }
            };
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    const amenitiesHTML = place.amenities && place.amenities.length > 0
        ? place.amenities.map((amenity) => `<li>${amenity.name}</li>`).join('')
        : '<li>No amenities available.</li>';

    const placeImage = getPlaceImage(place.title);
    const cleanDesc = place.description
        ? place.description.replace(/^\[[^\]]+\]\s*/, '')
        : 'No description available.';
    placeDetails.innerHTML = `
        ${placeImage ? `<img src="${placeImage}" alt="${place.title}" class="place-detail-image">` : ''}
        <h1>${place.title}</h1>

        <div class="place-info">
            <p><strong>Host:</strong> ${place.owner.first_name} ${place.owner.last_name}</p>
        </div>

        <div class="place-info">
            <p><strong>Gil per night:</strong> ${place.price} gil</p>
        </div>

        <div class="place-info">
            <p><strong>Description:</strong> ${cleanDesc}</p>
        </div>

        <div class="place-info">
            <p><strong>Location:</strong> ${place.latitude}, ${place.longitude}</p>
        </div>

        <div class="place-info">
            <p><strong>Amenities:</strong></p>
            <ul>${amenitiesHTML}</ul>
        </div>

        ${canDeletePlace ? `<button id="delete-place-btn" class="delete-button">Delete this place</button>` : ''}
    `;

    if (canDeletePlace) {
        document.getElementById('delete-place-btn').addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this place?')) return;
            try {
                const response = await fetch(`${API_URL}/places/${place.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    window.location.href = 'index.html';
                } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to delete place.');
                }
            } catch (error) {
                alert('Unable to connect to the server.');
            }
        });
    }

    reviewsSection.innerHTML = '<h2>Reviews</h2>';

    const admin = isAdmin(token);

    if (place.reviews && place.reviews.length > 0) {
        place.reviews.forEach((review, index) => {
            const reviewCard = document.createElement('article');
            reviewCard.className = 'review-card';

            const canDelete = token && (admin || review.user_id === currentUserId);

            reviewCard.innerHTML = `
                <h3>Review ${index + 1}</h3>
                <p><strong>Rating:</strong> ${review.rating}/5</p>
                <p>${review.text}</p>
                <p><strong>By:</strong> ${review.user_name || review.user_id}</p>
                ${canDelete ? `<button class="delete-button delete-review-btn" data-id="${review.id}">Delete</button>` : ''}
            `;

            reviewsSection.appendChild(reviewCard);
        });

        reviewsSection.querySelectorAll('.delete-review-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this review?')) return;

                try {
                    const response = await fetch(`${API_URL}/reviews/${btn.dataset.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const placeId = getPlaceIdFromURL();
                        fetchPlaceDetails(token, placeId);
                    } else {
                        const data = await response.json();
                        alert(data.error || 'Failed to delete review.');
                    }
                } catch (error) {
                    console.error('Error deleting review:', error);
                    alert('Unable to connect to the server.');
                }
            });
        });
    } else {
        reviewsSection.innerHTML += '<p>No reviews yet.</p>';
    }
}
/* =========================
   ADD REVIEW
========================= */
function initAddReviewPage() {
    const token = checkAuthenticationForReviewPage();
    const placeId = getPlaceIdFromURL();
    const reviewForm = document.getElementById('review-form');

    if (!token) {
        return;
    }

    if (!placeId) {
        window.location.href = 'index.html';
        return;
    }

    loadPlaceName(placeId, token);

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const reviewText = document.getElementById('review').value.trim();
            const rating = parseInt(document.getElementById('rating').value, 10);
            const message = document.getElementById('review-message');

            if (message) {
                message.textContent = '';
                message.className = '';
            }

            try {
                const response = await submitReview(token, placeId, reviewText, rating);
                const data = await response.json();

                if (response.ok) {
                    if (message) {
                        message.textContent = 'Review submitted successfully!';
                        message.className = 'success-message';
                    }
                    reviewForm.reset();
                } else {
                    if (message) {
                        message.textContent = data.error || 'Failed to submit review.';
                        message.className = 'error-message';
                    }
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                if (message) {
                    message.textContent = 'Unable to connect to the server.';
                    message.className = 'error-message';
                }
            }
        });
    }
}

function checkAuthenticationForReviewPage() {
    const token = getCookie('token');

    if (!token) {
        window.location.href = 'index.html';
        return null;
    }

    updateNavBar(token);
    return token;
}

async function loadPlaceName(placeId, token) {
    const placeNameElement = document.getElementById('place-name');

    try {
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/places/${placeId}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch place details');
        }

        const place = await response.json();

        if (placeNameElement) {
            placeNameElement.innerHTML = `<strong>Place:</strong> ${place.title}`;
        }
    } catch (error) {
        console.error('Error loading place name:', error);
        if (placeNameElement) {
            placeNameElement.innerHTML = '<strong>Place:</strong> Unknown place';
        }
    }
}

/* =========================
   CREATE USER (ADMIN)
========================= */
function initCreateUserPage() {
    const token = getCookie('token');

    if (!token || !isAdmin(token)) {
        window.location.href = 'index.html';
        return;
    }

    updateNavBar(token);

    const form = document.getElementById('create-user-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const message = document.getElementById('create-user-message');

        if (message) {
            message.textContent = '';
            message.className = '';
        }

        try {
            const response = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (message) {
                    message.textContent = `User "${firstName} ${lastName}" created successfully!`;
                    message.className = 'success-message';
                }
                form.reset();
            } else {
                if (message) {
                    message.textContent = data.error || 'Failed to create user.';
                    message.className = 'error-message';
                }
            }
        } catch (error) {
            console.error('Error creating user:', error);
            if (message) {
                message.textContent = 'Unable to connect to the server.';
                message.className = 'error-message';
            }
        }
    });
}

/* =========================
   CREATE PLACE
========================= */
function initCreatePlacePage() {
    const token = getCookie('token');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    updateNavBar(token);
    fetchAmenities(token);

    const form = document.getElementById('create-place-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('title').value.trim();
        const region = document.getElementById('region').value;
        const rawDescription = document.getElementById('description').value.trim();
        const description = region ? `[${region}] ${rawDescription}` : rawDescription;
        const price = parseFloat(document.getElementById('price').value);
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);
        const message = document.getElementById('create-place-message');

        const checkedAmenities = Array.from(
            document.querySelectorAll('#amenities-list input[type="checkbox"]:checked')
        ).map((cb) => cb.value);

        if (message) {
            message.textContent = '';
            message.className = '';
        }

        if (isNaN(price) || price <= 0) {
            if (message) {
                message.textContent = 'Price must be a positive number (greater than 0).';
                message.className = 'error-message';
            }
            return;
        }
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            if (message) {
                message.textContent = 'Latitude must be a number between -90 and 90.';
                message.className = 'error-message';
            }
            return;
        }
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            if (message) {
                message.textContent = 'Longitude must be a number between -180 and 180.';
                message.className = 'error-message';
            }
            return;
        }

        try {
            const response = await fetch(`${API_URL}/places/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    price,
                    latitude,
                    longitude,
                    amenities: checkedAmenities
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (message) {
                    message.textContent = `Place "${title}" created successfully!`;
                    message.className = 'success-message';
                }
                form.reset();
                document.querySelectorAll('#amenities-list input[type="checkbox"]').forEach((cb) => {
                    cb.checked = false;
                });
            } else {
                if (message) {
                    message.textContent = data.error || 'Failed to create place.';
                    message.className = 'error-message';
                }
            }
        } catch (error) {
            console.error('Error creating place:', error);
            if (message) {
                message.textContent = 'Unable to connect to the server.';
                message.className = 'error-message';
            }
        }
    });
}

async function fetchAmenities(token) {
    const amenitiesList = document.getElementById('amenities-list');
    if (!amenitiesList) return;

    try {
        const response = await fetch(`${API_URL}/amenities/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch amenities');

        const amenities = await response.json();
        amenitiesList.innerHTML = '';

        if (amenities.length === 0) {
            amenitiesList.innerHTML = '<p>No amenities available.</p>';
            return;
        }

        amenities.forEach((amenity) => {
            const label = document.createElement('label');
            label.className = 'amenity-checkbox';
            label.innerHTML = `
                <input type="checkbox" value="${amenity.id}"> ${amenity.name}
            `;
            amenitiesList.appendChild(label);
        });
    } catch (error) {
        console.error('Error fetching amenities:', error);
        amenitiesList.innerHTML = '<p>Could not load amenities.</p>';
    }
}

async function submitReview(token, placeId, reviewText, rating) {
    return fetch(`${API_URL}/reviews/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            text: reviewText,
            rating: rating,
            place_id: placeId
        })
    });
}