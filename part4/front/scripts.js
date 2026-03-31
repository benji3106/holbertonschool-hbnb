const API_URL = 'http://127.0.0.1:5000/api/v1';
let allPlaces = [];

document.addEventListener('DOMContentLoaded', () => {
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
function checkAuthenticationIndex() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');

    if (!token) {
        if (loginLink) {
            loginLink.style.display = 'inline-block';
        }
        fetchPlaces(null);
    } else {
        if (loginLink) {
            loginLink.style.display = 'none';
        }
        fetchPlaces(token);
    }
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

    placesList.innerHTML = '<h2>Available Places</h2>';

    places.forEach((place) => {
        const placeCard = document.createElement('article');
        placeCard.className = 'place-card';
        placeCard.dataset.price = place.price;

        placeCard.innerHTML = `
            <h3>${place.title}</h3>
            <p>${place.description ? place.description : 'No description available.'}</p>
            <p><strong>Price per night:</strong> $${place.price}</p>
            <a href="place.html?id=${place.id}" class="details-button">View Details</a>
        `;

        placesList.appendChild(placeCard);
    });
}

function setupPriceFilter() {
    const priceFilter = document.getElementById('price-filter');

    if (!priceFilter) {
        return;
    }

    priceFilter.addEventListener('change', (event) => {
        const selectedValue = event.target.value;

        if (selectedValue === 'all') {
            displayPlaces(allPlaces);
            return;
        }

        const maxPrice = parseFloat(selectedValue);
        const filteredPlaces = allPlaces.filter((place) => place.price <= maxPrice);
        displayPlaces(filteredPlaces);
    });
}

/* =========================
   PLACE DETAILS
========================= */
function initPlaceDetailsPage() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');
    const addReviewSection = document.getElementById('add-review');
    const placeId = getPlaceIdFromURL();

    if (!placeId) {
        console.error('No place ID found in URL');
        return;
    }

    if (!token) {
        if (loginLink) {
            loginLink.style.display = 'inline-block';
        }
        if (addReviewSection) {
            addReviewSection.style.display = 'none';
        }
    } else {
        if (loginLink) {
            loginLink.style.display = 'none';
        }
        if (addReviewSection) {
            addReviewSection.style.display = 'block';
        }
    }

    fetchPlaceDetails(token, placeId);
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

    const amenitiesHTML = place.amenities && place.amenities.length > 0
        ? place.amenities.map((amenity) => `<li>${amenity.name}</li>`).join('')
        : '<li>No amenities available.</li>';

    placeDetails.innerHTML = `
        <h1>${place.title}</h1>

        <div class="place-info">
            <p><strong>Host:</strong> ${place.owner.first_name} ${place.owner.last_name}</p>
        </div>

        <div class="place-info">
            <p><strong>Price per night:</strong> $${place.price}</p>
        </div>

        <div class="place-info">
            <p><strong>Description:</strong> ${place.description ? place.description : 'No description available.'}</p>
        </div>

        <div class="place-info">
            <p><strong>Location:</strong> ${place.latitude}, ${place.longitude}</p>
        </div>

        <div class="place-info">
            <p><strong>Amenities:</strong></p>
            <ul>${amenitiesHTML}</ul>
        </div>
    `;

    reviewsSection.innerHTML = '<h2>Reviews</h2>';

    if (place.reviews && place.reviews.length > 0) {
        place.reviews.forEach((review, index) => {
            const reviewCard = document.createElement('article');
            reviewCard.className = 'review-card';

            reviewCard.innerHTML = `
                <h3>Review ${index + 1}</h3>
                <p><strong>Rating:</strong> ${review.rating}/5</p>
                <p>${review.text}</p>
                <p><strong>User ID:</strong> ${review.user_id}</p>
            `;

            reviewsSection.appendChild(reviewCard);
        });
    } else {
        reviewsSection.innerHTML += '<p>No reviews yet.</p>';
    }
}
