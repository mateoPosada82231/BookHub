# 📖 BookHub

> Plataforma para descubrir y reservar servicios de belleza, bienestar y más.

## 🎯 Descripción

BookHub es un sistema de gestión de citas que conecta clientes con negocios de servicios. Los usuarios pueden:

- **Clientes**: Buscar negocios, filtrar por categoría/ciudad, reservar citas, dejar reseñas, guardar favoritos
- **Dueños**: Gestionar negocios, servicios, trabajadores, horarios y galería de imágenes
- **Trabajadores**: Ver su agenda de citas, completar/cancelar citas, gestionar su horario

## 🏗️ Arquitectura

```
bookhub/
├── backend/             # Spring Boot 3.4.1 (Java 17)
│   ├── src/main/java/   # API REST, servicios, entidades
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── logback-spring.xml
│   │   └── db/migration/  # Flyway migrations (V1-V5)
│   └── Dockerfile
├── frontend/            # Next.js 16 (React 19 + TypeScript)
│   ├── src/app/         # App Router (páginas)
│   ├── src/components/  # Componentes reutilizables
│   ├── src/lib/api/     # Cliente HTTP modular
│   └── Dockerfile
├── docker-compose.yml   # PostgreSQL + Backend + Frontend
└── .env.example         # Variables de entorno
```

## 🚀 Tecnologías

### Backend

- **Java 17** + **Spring Boot 3.4.1**
- **Spring Security** + JWT (access + refresh tokens)
- **Spring Data JPA** + PostgreSQL
- **Flyway** (migraciones de base de datos)
- **Bucket4j** (rate limiting)
- **SpringDoc OpenAPI 2.7** (Swagger UI)
- **Lombok** + **MapStruct**

### Frontend

- **Next.js 16** (App Router, SSR, standalone)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion** (animaciones, modales)
- **FontAwesome** + **Lucide React** (iconos)
- **react-hot-toast** (notificaciones)

## 📦 Inicio Rápido

### Requisitos

- Node.js 20+
- Java 17+
- Docker Desktop (o PostgreSQL local)

### Opción 1: Desarrollo local

```bash
# Si no tienes postgres corriendo, puedes crear uno:
docker run -d --name bookhub-db -e POSTGRES_USER=bookhub -e POSTGRES_PASSWORD=bookhub_secret -e POSTGRES_DB=bookhub -p 5432:5432 postgres:16-alpine
```

# 2. Levantar base de datos

docker compose up postgres -d

# 3. Backend

cd backend
./mvnw spring-boot:run

# → http://localhost:8082

# → Swagger: http://localhost:8082/swagger-ui.html

# 4. Frontend (en otra terminal)

cd frontend
npm install
npm run dev

# → http://localhost:3000

````

### Opción 2: Docker Compose (stack completo)

```bash
cp .env.example .env
# Editar .env con tus valores
docker compose --profile full up --build
````

### Usuarios de prueba (seed data)

| Email            | Password    | Rol    |
| ---------------- | ----------- | ------ |
| owner1@test.com  | password123 | OWNER  |
| owner2@test.com  | password123 | OWNER  |
| worker1@test.com | password123 | WORKER |
| client1@test.com | password123 | CLIENT |

## 📡 API Endpoints

### Autenticación

| Método | Endpoint                    | Descripción         |
| ------ | --------------------------- | ------------------- |
| POST   | `/api/auth/register`        | Registro            |
| POST   | `/api/auth/login`           | Login               |
| POST   | `/api/auth/refresh`         | Refresh token       |
| POST   | `/api/auth/logout`          | Logout              |
| POST   | `/api/auth/forgot-password` | Solicitar reset     |
| POST   | `/api/auth/reset-password`  | Resetear contraseña |

### Negocios (público)

| Método | Endpoint                        | Descripción         |
| ------ | ------------------------------- | ------------------- |
| GET    | `/api/businesses/search`        | Buscar negocios     |
| GET    | `/api/businesses/{id}`          | Detalle de negocio  |
| GET    | `/api/businesses/categories`    | Lista de categorías |
| GET    | `/api/businesses/{id}/services` | Servicios           |
| GET    | `/api/businesses/{id}/workers`  | Trabajadores        |
| GET    | `/api/businesses/{id}/reviews`  | Reseñas             |

### Citas (autenticado)

| Método | Endpoint                                    | Descripción          |
| ------ | ------------------------------------------- | -------------------- |
| POST   | `/api/appointments`                         | Crear cita           |
| GET    | `/api/appointments/my`                      | Mis citas (paginado) |
| GET    | `/api/appointments/availability/{workerId}` | Disponibilidad       |
| PATCH  | `/api/appointments/{id}`                    | Actualizar estado    |
| POST   | `/api/appointments/{id}/cancel`             | Cancelar             |
| POST   | `/api/appointments/{id}/review`             | Dejar reseña         |

### Gestión de negocio (OWNER)

| Método | Endpoint                        | Descripción        |
| ------ | ------------------------------- | ------------------ |
| POST   | `/api/businesses`               | Crear negocio      |
| PUT    | `/api/businesses/{id}`          | Editar negocio     |
| POST   | `/api/businesses/{id}/services` | Crear servicio     |
| POST   | `/api/businesses/{id}/workers`  | Agregar trabajador |

> Documentación completa en Swagger UI: `http://localhost:8082/swagger-ui.html`

## 📱 Categorías de Negocio

| Categoría                 | Descripción                               |
| ------------------------- | ----------------------------------------- |
| ✂️ Barbería               | Cortes, afeitados, tratamientos capilares |
| 💇‍♀️ Salón de Belleza       | Peinados, coloración, tratamientos        |
| 💅 Manicura/Pedicura      | Uñas, nail art, spa de manos/pies         |
| 🧖 Spa                    | Masajes, tratamientos corporales          |
| 🚗 Autolavado             | Lavado de vehículos                       |
| 🐕 Peluquería de Mascotas | Grooming, baño, corte                     |
| 🎨 Estudio de Tatuajes    | Tatuajes, piercings                       |
| 📍 Otro                   | Otros servicios                           |

## 🗄️ Modelo de Datos

### Entidades principales

- **User** → Perfil, rol (OWNER/WORKER/CLIENT)
- **Business** → Servicios, trabajadores, galería, reseñas
- **Worker** → Horarios semanales (WorkerSchedule)
- **Appointment** → Cita con estado (PENDING → CONFIRMED → COMPLETED)
- **Review** → Rating 1-5 + comentario
- **Favorite** → Negocios favoritos del usuario

### Seguridad

- JWT stateless (access token 24h + refresh token 7d)
- BCrypt para contraseñas
- Rate limiting: login (5/15min), general (100/min)
- CORS restringido a localhost

## 🧪 Tests

```bash
# Backend
cd backend
./mvnw test

# CI ejecuta tests automáticamente en push a main/development
```

## 📄 Licencia


MIT © 2026 BookHub
