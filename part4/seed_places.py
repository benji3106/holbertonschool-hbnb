"""
Script to seed example places into the database.
Run from the part4 directory: python seed_places.py
"""

from app import create_app, db
from app.models.place import Place
from app.models.user import User
from app.models.amenity import Amenity

app = create_app()

PLACES = [
    {
        "title": "Cozy Studio in the City Center",
        "description": "A bright and modern studio located in the heart of the city. Perfect for solo travelers or couples.",
        "price": 75.0,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "amenities": ["Wi-Fi", "Air Conditioning"]
    },
    {
        "title": "Charming Countryside Cottage",
        "description": "A peaceful retreat in the countryside with stunning views. Ideal for a relaxing weekend getaway.",
        "price": 120.0,
        "latitude": 44.8378,
        "longitude": -0.5792,
        "amenities": ["Wi-Fi"]
    },
    {
        "title": "Luxury Beachfront Villa",
        "description": "Stunning villa right on the beach with private pool and panoramic sea views.",
        "price": 350.0,
        "latitude": 43.2965,
        "longitude": 5.3698,
        "amenities": ["Wi-Fi", "Swimming Pool", "Air Conditioning"]
    },
    {
        "title": "Modern Loft with City View",
        "description": "Stylish loft apartment on the 10th floor with breathtaking city views and all amenities.",
        "price": 95.0,
        "latitude": 45.7640,
        "longitude": 4.8357,
        "amenities": ["Wi-Fi", "Air Conditioning"]
    },
    {
        "title": "Cozy Mountain Chalet",
        "description": "Authentic wooden chalet in the mountains. Perfect for skiing in winter or hiking in summer.",
        "price": 150.0,
        "latitude": 45.9237,
        "longitude": 6.8694,
        "amenities": ["Wi-Fi"]
    },
]

with app.app_context():
    # Get the admin user as owner
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        print("No admin user found. Please create an admin user first.")
        exit(1)

    print(f"Using admin: {admin.first_name} {admin.last_name} ({admin.email})")

    created = 0
    for place_data in PLACES:
        # Skip if place with same title already exists
        existing = Place.query.filter_by(title=place_data["title"]).first()
        if existing:
            print(f"  Skipping (already exists): {place_data['title']}")
            continue

        # Find amenities by name
        amenities = []
        for amenity_name in place_data.get("amenities", []):
            amenity = Amenity.query.filter_by(name=amenity_name).first()
            if amenity:
                amenities.append(amenity)

        place = Place(
            title=place_data["title"],
            description=place_data["description"],
            price=place_data["price"],
            latitude=place_data["latitude"],
            longitude=place_data["longitude"],
            owner_id=admin.id
        )
        place.amenities = amenities

        db.session.add(place)
        print(f"  Created: {place_data['title']}")
        created += 1

    db.session.commit()
    print(f"\nDone! {created} place(s) added.")
