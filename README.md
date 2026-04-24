# Taller Dayana

MVP multi-app para el taller de enderezado y pintura Taller Dayana en Costa Rica.

## Estructura

- `web/`: landing page y panel admin en Next.js + Tailwind
- `mobile/`: app Expo + React Native
- `backend/`: API Node.js + Express + JWT
- `backend/db/schema.sql`: esquema base PostgreSQL
- `.gitignore`: exclusiones para dependencias, builds y archivos de entorno generados

## Requisitos

- Node.js 18 o superior
- npm

## Variables de entorno

También tienes un ejemplo unificado en [`.env.example`](.env.example).

Backend (`backend/.env`):

```env
PORT=4000
JWT_SECRET=change-me
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
DATABASE_URL=
```

Web (`web/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Mobile (`mobile/.env`):

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Ejecutar en desarrollo

Desde la raíz del workspace también puedes usar los atajos:

```bash
npm run setup:env
npm run verify
npm run backend
npm run web
npm run mobile
npm run start:all
```

### 1) Backend

```bash
cd backend
npm install
node src/server.js
```

### 2) Web

```bash
cd web
npm install
npm run dev
```

### 3) Mobile

```bash
cd mobile
npm install
npx expo start
```

## Verificación

- Web: abrir `http://localhost:3000` y `http://localhost:3000/admin`
- Backend: comprobar `GET http://localhost:4000/health`
- Mobile: abrir Expo y verificar presupuesto, cita, estado y contacto

## Notas

- El backend guarda datos en memoria para el MVP, con esquema PostgreSQL documentado en `backend/db/schema.sql`.
- Si `DATABASE_URL` está configurada, el backend también persiste clientes, vehículos, citas, presupuestos y notificaciones en PostgreSQL, inicializa el esquema automáticamente al arrancar y carga un seed demo si las tablas están vacías.
- El panel admin usa JWT con el usuario demo `admin` y contraseña `admin123`.
