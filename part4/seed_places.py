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
        "title": "Mist Cottage - Sea Breeze Estate",
        "description": "[La Noscea] A charming cottage perched above the Mist district, offering breathtaking views of the Rhotano Sea. Salt air, the sound of gulls, and golden sunsets await weary adventurers.",
        "price": 120.0,
        "latitude": 34.0,
        "longitude": 135.0,
        "amenities": ["Wi-Fi", "Swimming Pool"]
    },
    {
        "title": "Lavender Beds Manor",
        "description": "[The Black Shroud] A refined manor nestled among the lavender fields of the Black Shroud. Elementals whisper through the trees at dusk, and the scent of wildflowers fills every room.",
        "price": 200.0,
        "latitude": 35.5,
        "longitude": 139.5,
        "amenities": ["Wi-Fi", "Air Conditioning"]
    },
    {
        "title": "Goblet Penthouse Suite",
        "description": "[Thanalan] A luxury penthouse atop a sandstone tower in the Goblet, with panoramic views of the Ul'dahn desert. Gilded furnishings, private terrace, and a rooftop pool.",
        "price": 450.0,
        "latitude": 25.0,
        "longitude": 55.0,
        "amenities": ["Wi-Fi", "Swimming Pool", "Air Conditioning"]
    },
    {
        "title": "Coerthas Highland Retreat",
        "description": "[Coerthas] A stone stronghold converted into a cozy retreat in the snowfields of Coerthas. Roaring hearth, thick furs, and mulled Ishgardian wine included. Perfect after a hunt.",
        "price": 180.0,
        "latitude": 46.0,
        "longitude": 7.5,
        "amenities": ["Wi-Fi"]
    },
    {
        "title": "Shirogane Riverside Inn",
        "description": "[Hingashi] A traditional Far Eastern inn on the banks of the Shirogane waterway. Tatami floors, shoji screens, and a private onsen with garden view. Tranquility incarnate.",
        "price": 260.0,
        "latitude": 34.7,
        "longitude": 135.5,
        "amenities": ["Wi-Fi", "Air Conditioning"]
    },
    {
        "title": "Mor Dhona Crystal Loft",
        "description": "[Mor Dhona] A unique loft built into the crystalline outcroppings of Mor Dhona. The crystals glow softly at night, casting prismatic light across the walls. Truly one of a kind.",
        "price": 95.0,
        "latitude": 46.5,
        "longitude": 13.0,
        "amenities": ["Wi-Fi"]
    },
    {
        "title": "Dravania Sky Cabin",
        "description": "[Dravania] A daring cabin suspended on the cliffs of Dravania, overlooking the Churning Mists below. Dragons soar past the balcony at dawn. Not for the faint of heart.",
        "price": 310.0,
        "latitude": 47.0,
        "longitude": 15.0,
        "amenities": ["Wi-Fi", "Air Conditioning"]
    },
    {
        "title": "Rhalgr's Reach Lodging",
        "description": "[Gyr Abania] A sturdy traveler's lodge in the heart of Gyr Abania. Simple but welcoming, with a common room full of stories, strong ale, and the warmth of Ala Mhigan hospitality.",
        "price": 60.0,
        "latitude": 41.0,
        "longitude": 20.0,
        "amenities": ["Wi-Fi"]
    },
]

with app.app_context():
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        print("No admin user found. Please create an admin user first.")
        exit(1)

    print(f"Using admin: {admin.first_name} {admin.last_name} ({admin.email})")

    created = 0
    for place_data in PLACES:
        existing = Place.query.filter_by(title=place_data["title"]).first()
        if existing:
            print(f"  Skipping (already exists): {place_data['title']}")
            continue

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
