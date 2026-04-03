# EorzeaHBnB

A Final Fantasy XIV themed rental platform — a simplified AirBnB clone built as part of the Holberton School HBnB project.

Browse estates across the regions of Eorzea, leave reviews, and manage your own properties.

---

## Features

- Browse available estates with images, region badges and average ratings
- Filter by minimum price and region (La Noscea, Thanalan, Coerthas...)
- Paginated place listing (6 per page)
- Place detail page with amenities, reviews and host info
- User authentication (JWT)
- Create, view and delete places
- Submit and delete reviews
- Admin panel: create users, manage all places and reviews
- Profile page: edit your first and last name
- Auto-logout when session expires
- FF14 themed UI: Cinzel font, gold accents, dark blue palette

---

## Tech Stack

**Backend**
- Python 3 / Flask
- Flask-RESTX (API + Swagger docs)
- Flask-JWT-Extended (authentication)
- Flask-SQLAlchemy + SQLite
- Flask-Bcrypt (password hashing)
- Flask-CORS

**Frontend**
- Vanilla HTML / CSS / JavaScript (ES6)
- Fetch API
- Google Fonts (Cinzel, Lato)

---

## Project Structure

```
part4/
├── app/
│   ├── api/v1/          # REST API endpoints
│   │   ├── auth.py      # Login
│   │   ├── users.py     # User CRUD
│   │   ├── places.py    # Place CRUD
│   │   ├── reviews.py   # Review CRUD
│   │   └── amenities.py # Amenity CRUD
│   ├── models/          # SQLAlchemy models
│   │   ├── user.py
│   │   ├── place.py
│   │   ├── review.py
│   │   └── amenity.py
│   └── services/
│       └── facade.py    # Business logic layer
├── front/               # Static frontend
│   ├── index.html       # Place listing
│   ├── place.html       # Place details
│   ├── login.html       # Login
│   ├── profile.html     # User profile
│   ├── create_place.html
│   ├── create_user.html
│   ├── add_review.html
│   ├── scripts.js       # All frontend logic
│   ├── styles.css       # FF14 theme
│   └── images/          # Place images + icons
├── config.py
├── run.py
├── seed_places.py       # Seeds 8 Eorzea example places
└── setup.sh             # Full setup script
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd holbertonschool-hbnb-1/part4
```

### 2. Run the setup script

```bash
bash setup.sh
```

This will automatically:
- Create a Python virtual environment
- Install all dependencies
- Initialize the SQLite database
- Create an admin user
- Create the FF14 amenities
- Seed 8 example Eorzea estates

### 3. Start the backend

```bash
source .venv/bin/activate
python3 run.py
```

The API will be available at `http://127.0.0.1:5000`  
Swagger documentation: `http://127.0.0.1:5000`

### 4. Start the frontend

Open a second terminal:

```bash
cd front
python3 -m http.server 8000
```

Then open your browser at: **http://localhost:8000**

---

## Default Admin Account

| Field    | Value              |
|----------|--------------------|
| Email    | admin@eorzea.com   |
| Password | Admin1234!         |

---

## API Endpoints

| Method | Endpoint                    | Description              | Auth required |
|--------|-----------------------------|--------------------------|---------------|
| POST   | /api/v1/auth/login          | Login                    | No            |
| GET    | /api/v1/places/             | List all places          | No            |
| GET    | /api/v1/places/<id>         | Get place details        | No            |
| POST   | /api/v1/places/             | Create a place           | Yes           |
| DELETE | /api/v1/places/<id>         | Delete a place           | Yes (owner/admin) |
| GET    | /api/v1/reviews/            | List all reviews         | No            |
| POST   | /api/v1/reviews/            | Submit a review          | Yes           |
| DELETE | /api/v1/reviews/<id>        | Delete a review          | Yes (owner/admin) |
| GET    | /api/v1/users/              | List all users           | No            |
| POST   | /api/v1/users/              | Create a user            | Yes (admin)   |
| GET    | /api/v1/users/<id>          | Get user details         | No            |
| PUT    | /api/v1/users/<id>          | Update user profile      | Yes           |
| GET    | /api/v1/amenities/          | List amenities           | No            |

---

## Eorzea Regions

Places can be assigned to one of the following regions:

| Region           | Description                        |
|------------------|------------------------------------|
| La Noscea        | Coastal cliffs and port towns      |
| The Black Shroud | Mystical forest of the elementals  |
| Thanalan         | Desert ruins and Ul'dahn sands     |
| Coerthas         | Snowfields and Ishgardian keeps    |
| Mor Dhona        | Crystalline wasteland              |
| Abalathia        | Mountain peaks and sea of clouds   |
| Dravania         | Dragon territory and misty cliffs  |
| Gyr Abania       | Highland ruins of Ala Mhigo        |
| Othard           | Far Eastern steppes                |
| Hingashi         | Far Eastern island nation          |

---

## Authors

- Benjamin — [GitHub](https://github.com/benji3106)

*Built as part of the Holberton School HBnB project — Part 4*
