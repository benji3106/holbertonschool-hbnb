const API_URL = 'http://127.0.0.1:5000/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    console.log("scripts.js loaded");

    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const errorMessage = document.getElementById('error-message');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            console.log("Email sent:", email);
            console.log("Password sent:", password);

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

                console.log("Response status:", response.status);
                console.log("Response data:", data);

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
});
