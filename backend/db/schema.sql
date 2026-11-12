CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  legal_name VARCHAR(150),
  owner_name VARCHAR(120),
  phone VARCHAR(30) NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  email VARCHAR(120) NOT NULL,
  province VARCHAR(40) DEFAULT 'Alajuela',
  canton VARCHAR(60) DEFAULT 'Alajuela',
  address TEXT,
  maps_url TEXT,
  waze_url TEXT,
  brand_color VARCHAR(10) DEFAULT '#d62828',
  secondary_color VARCHAR(10) DEFAULT '#18181b',
  logo_url TEXT,
  custom_domain VARCHAR(120),
  plan VARCHAR(30) DEFAULT 'pro',
  monthly_fee INTEGER DEFAULT 45000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO tenants (id, slug, name, legal_name, owner_name, phone, whatsapp, email, province, canton, address, brand_color, plan, monthly_fee, is_active)
VALUES 
  (1, 'taller-dayana', 'Taller Dayana', 'Taller Dayana S.A.', 'Dagoberto y Randy Barrantes', '7043-9248', '50670439248', 'tallerdayanacr@gmail.com', 'Alajuela', 'Barrio San José', 'Barrio San José, Alajuela, Costa Rica (Costado norte de la plaza de deportes)', '#d62828', 'elite', 0, TRUE),
  (2, 'autofix-heredia', 'AutoFix Heredia', 'AutoFix San Pablo S.R.L.', 'Carlos Méndez', '8312-4455', '50683124455', 'contacto@autofixheredia.cr', 'Heredia', 'San Pablo', '300m Norte del Masxmenos, San Pablo de Heredia', '#2563eb', 'pro', 45000, TRUE),
  (3, 'enderezado-coyol', 'Enderezado El Coyol', 'Taller Automotriz El Coyol', 'Esteban Rojas', '8765-1122', '50687651122', 'tallerelcoyol@gmail.com', 'Alajuela', 'El Coyol', 'Frente a Parque Industrial Zona Franca, El Coyol de Alajuela', '#059669', 'basico', 25000, TRUE)
ON CONFLICT (slug) DO NOTHING;

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
  tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
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

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
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

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshop_vehicles (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
  plate VARCHAR(20) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  work_type VARCHAR(80) NOT NULL,
  entry_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'received',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE workshop_vehicles
ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS workshop_progress_photos (
  id SERIAL PRIMARY KEY,
  workshop_vehicle_id INTEGER NOT NULL REFERENCES workshop_vehicles(id) ON DELETE CASCADE,
  tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
  plate VARCHAR(20) NOT NULL,
  photo_url TEXT NOT NULL,
  video_url TEXT,
  media_type VARCHAR(20) DEFAULT 'image',
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE workshop_progress_photos
ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

ALTER TABLE workshop_progress_photos
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';

ALTER TABLE workshop_progress_photos
ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
  customer_name VARCHAR(120) NOT NULL,
  plate VARCHAR(20),
  vehicle VARCHAR(120),
  comment TEXT NOT NULL,
  ratings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
