# Taller Dayana - Technical Architecture & UX Foundation

## Objetivo
Implementar un MVP completo y mínimo, alineado al spec, en tres módulos: `web/`, `mobile/`, `backend/`.

## Arquitectura General

- `web/`: Next.js (App Router) + Tailwind CSS
- `mobile/`: Expo + React Native
- `backend/`: Node.js + Express + JWT
- `backend/db/schema.sql`: esquema PostgreSQL base

### Flujo principal

1. Usuario web/móvil envía presupuesto/cita.
2. Backend valida y guarda (modo demo en memoria + contrato SQL documentado).
3. Admin consulta y actualiza estado.
4. Móvil consulta estado por placa y muestra notificación en UI.

## UX & Diseño

- Nombre visible permanente: "Taller Dayana"
- Paleta estricta:
  - Negro: `#0B0B0B`
  - Rojo: `#D62828`
  - Blanco: `#F7F7F7`
- Estilo: tarjetas limpias, tipografía fuerte, apariencia automotriz profesional.
- Responsive web: mobile-first con grid adaptable.

## Contratos API (MVP)

- `POST /api/auth/login` -> token JWT para admin demo
- `GET /api/services` -> lista de servicios
- `GET /api/gallery` -> trabajos antes/después
- `POST /api/quotes` -> crear presupuesto
- `POST /api/appointments` -> crear cita
- `GET /api/repairs/status/:plate` -> estado de reparación
- `GET /api/admin/appointments` (JWT)
- `PATCH /api/admin/appointments/:id/status` (JWT)
- `GET /api/admin/quotes` (JWT)

## Criterios de calidad para QA

- Cada tarea debe incluir evidencia concreta:
  - existencia de archivos,
  - validación de sintaxis/comandos,
  - verificación funcional mínima (curl o checks equivalentes).
- Si falla: corregir la tarea antes de avanzar.
