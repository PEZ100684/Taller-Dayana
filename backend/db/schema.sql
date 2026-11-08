CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  make_model VARCHAR(120) NOT NULL,
  plate VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  damage_description TEXT NOT NULL,
  photos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(40) NOT NULL DEFAULT 'received',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS photos_json JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS contact_channel VARCHAR(30) DEFAULT 'whatsapp';

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS email VARCHAR(120);

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS selected_parts JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP,
  status VARCHAR(40) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE appointments
ALTER COLUMN appointment_date TYPE TIMESTAMP USING appointment_date::timestamp;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS contact_channel VARCHAR(30) DEFAULT 'whatsapp';

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS email VARCHAR(120);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshop_vehicles (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(20) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  work_type VARCHAR(80) NOT NULL,
  entry_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'received',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshop_progress_photos (
  id SERIAL PRIMARY KEY,
  workshop_vehicle_id INTEGER NOT NULL REFERENCES workshop_vehicles(id) ON DELETE CASCADE,
  plate VARCHAR(20) NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  plate VARCHAR(20),
  vehicle VARCHAR(120),
  comment TEXT NOT NULL,
  ratings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP DEFAULT NOW()
);
