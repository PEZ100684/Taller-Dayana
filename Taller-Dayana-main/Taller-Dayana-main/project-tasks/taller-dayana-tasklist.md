# Taller Dayana - Task List (Spec-Driven)

Fuente de verdad: `project-specs/taller-dayana-setup.md`

## Requisitos citados del spec

- Web (en `web/`):
  - "Landing page con información del taller"
  - "Sección de servicios con fotos"
  - "Galería de trabajos antes y después"
  - "Formulario para pedir presupuesto"
  - "Ubicación y horarios"
  - "Testimonios de clientes"
- Mobile (en `mobile/`):
  - "Pedir cita o presupuesto desde el celular"
  - "Ver el estado de reparación del vehículo"
  - "Galería de trabajos realizados"
  - "Botón para llamar o escribir por WhatsApp"
  - "Notificaciones cuando el carro está listo"
- Backend (en `backend/`):
  - "API para gestionar citas y presupuestos"
  - "Panel de administración para el dueño"
  - "Base de datos de clientes y vehículos"
  - "Sistema de notificaciones"
- Stack:
  - "Web: Next.js + Tailwind CSS"
  - "App: Expo + React Native"
  - "Backend: Node.js + Express"
  - "Base de datos: PostgreSQL"
  - "Autenticación: JWT"
- Diseño:
  - "Colores: negro, rojo y blanco"
  - "Estilo: profesional, moderno, automotriz"
  - "Nombre visible: Taller Dayana"
- Aceptación:
  - "Página web funciona en celular y computadora"
  - "Formulario de presupuesto funcional"
  - "Galería con imágenes de ejemplo"
  - "Panel admin para gestionar citas"

## Tareas

### [x] T1 - Crear estructura base multi-app (`web/`, `mobile/`, `backend/`)
### [x] T2 - Implementar web Next.js + Tailwind con secciones requeridas y diseño negro/rojo/blanco
### [x] T3 - Implementar formulario de presupuesto funcional conectado al backend
### [x] T4 - Implementar backend Node.js + Express con JWT y endpoints de citas/presupuestos/estado/admin
### [x] T5 - Definir capa de datos PostgreSQL (esquema SQL y acceso en backend)
### [x] T6 - Implementar panel admin para gestionar citas y presupuestos
### [x] T7 - Implementar app Expo + React Native con flujo de cita/presupuesto, estado, galería y contacto
### [x] T8 - Implementar sistema de notificaciones en backend y consumo en móvil (simulado en UI)
### [x] T9 - Validar criterios de aceptación con evidencia y comandos ejecutables

## Evidencia resumida

- Build web exitoso con Next.js.
- Verificación backend exitosa con auth, quotes, appointments, repair status, admin quotes, admin appointments y notifications.
- Validación de sintaxis sin errores en archivos editados.

## Regla de ejecución

Cada tarea debe pasar el ciclo estricto:
1. Implementación
2. Evidencia/Pruebas
3. QA explícito PASS antes de continuar
