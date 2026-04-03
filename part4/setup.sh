#!/bin/bash

# ============================================================
#  EorzeaHBnB — Setup Script
#  Run from the part4/ directory: bash setup.sh
# ============================================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ___                             _   _ ____        ____  "
echo " | __|  ___  _ _  ___ ___  __ _ | | | | __ )  _ __ \ \ \ "
echo " | _|  / _ \| '_||_ // -_)/ _\` || |_| |  _ \ | '_ \ > > >"
echo " |___| \___/|_|  /__|___|\__,_| \___/|____/ | .__//_/_/_/ "
echo "                                             |_|           "
echo -e "${NC}"
echo -e "${YELLOW}Starting EorzeaHBnB setup...${NC}"
echo ""

# --- 1. Virtual environment ---
echo -e "${BLUE}[1/6] Setting up virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}  ✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}  ✓ Virtual environment already exists${NC}"
fi

source .venv/bin/activate

# --- 2. Install dependencies ---
echo -e "${BLUE}[2/6] Installing dependencies...${NC}"
pip install -q -r requirements.txt
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# --- 3. Initialize database ---
echo -e "${BLUE}[3/6] Initializing database...${NC}"
python3 - <<'PYEOF'
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    # Add image_url column if missing (no migration system)
    from sqlalchemy import text, inspect
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('places')]
    if 'image_url' not in columns:
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE places ADD COLUMN image_url VARCHAR(512)'))
            conn.commit()
        print("  + image_url column added to places")
    print("  ✓ Database ready")
PYEOF

# --- 4. Create admin user ---
echo -e "${BLUE}[4/6] Creating admin user...${NC}"
python3 - <<'PYEOF'
from app import create_app, db
from app.models.user import User
from app import bcrypt

app = create_app()
with app.app_context():
    existing = User.query.filter_by(email='admin@eorzea.com').first()
    if existing:
        print("  ✓ Admin user already exists")
    else:
        admin = User(
            first_name='Admin',
            last_name='HBnB',
            email='admin@eorzea.com',
            password=bcrypt.generate_password_hash('Admin1234!').decode('utf-8'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print("  ✓ Admin user created")
        print("    Email   : admin@eorzea.com")
        print("    Password: Admin1234!")
PYEOF

# --- 5. Create amenities ---
echo -e "${BLUE}[5/6] Creating amenities...${NC}"
python3 - <<'PYEOF'
from app import create_app, db
from app.models.amenity import Amenity

app = create_app()
with app.app_context():
    amenities = ['Aethernet Access', 'Moonlift Baths', 'Wind Crystal Cooling']
    for name in amenities:
        if not Amenity.query.filter_by(name=name).first():
            db.session.add(Amenity(name=name))
            print(f"  + {name}")
    db.session.commit()
    print("  ✓ Amenities ready")
PYEOF

# --- 6. Seed example places ---
echo -e "${BLUE}[6/6] Seeding example places...${NC}"
python3 seed_places.py

# --- Done ---
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${YELLOW}Admin credentials:${NC}"
echo -e "    Email   : admin@eorzea.com"
echo -e "    Password: Admin1234!"
echo ""
echo -e "  ${YELLOW}To start the app:${NC}"
echo ""
echo -e "  ${BLUE}Terminal 1 — Backend:${NC}"
echo -e "    cd part4"
echo -e "    source .venv/bin/activate"
echo -e "    python3 run.py"
echo ""
echo -e "  ${BLUE}Terminal 2 — Frontend:${NC}"
echo -e "    cd part4/front"
echo -e "    python3 -m http.server 8000"
echo ""
echo -e "  ${BLUE}Then open:${NC} http://localhost:8000"
echo ""
