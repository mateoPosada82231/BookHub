# 📖 BookHub

> Una plataforma estilo red social para descubrir y reservar servicios de belleza, bienestar y más.

## 🎯 Descripción

BookHub es un sistema de gestión de citas que funciona como una red social de servicios. Los usuarios pueden:

- **Clientes**: Buscar negocios, filtrar por categoría, reservar citas
- **Dueños**: Gestionar su negocio, ver estadísticas, administrar trabajadores
- **Trabajadores**: Ver su agenda de citas asignadas

## 🏗️ Arquitectura

```
bookhub/
├── backend/           # Spring Boot API (Java 21)
│   ├── src/main/java/ # Código fuente
│   ├── src/test/      # Tests unitarios
│   └── pom.xml        # Dependencias Maven
├── frontend/          # Next.js 16 (React + TypeScript)
│   ├── src/app/       # App Router (páginas)
│   ├── src/components/# Componentes reutilizables
│   └── src/lib/       # Utilidades y API client
└── docker-compose.yml # PostgreSQL (contenedor externo)
```

## 🚀 Tecnologías

### Backend

- **Java 21** + **Spring Boot 3.5**
- **Spring Security** (JWT Authentication)
- **Spring Data JPA** (PostgreSQL)
- **Lombok** (Reducir boilerplate)
- **Docker Compose** (Base de datos)

### Frontend

- **Next.js 16** (App Router, SSR)
- **TypeScript** (Tipado estricto)
- **Tailwind CSS** (Estilos)
- **Framer Motion** (Animaciones)
- **Lucide React** (Iconos)

## 📦 Inicio Rápido

### Requisitos

- Node.js 18+
- Java 21+
- Docker Desktop

### 1. Base de Datos

Asegúrate de tener un contenedor de PostgreSQL corriendo en el puerto 5432 con una base de datos `bookhub`.

```bash
# Si no tienes postgres corriendo, puedes crear uno:
docker run -d --name bookhub-db -e POSTGRES_USER=bookhub -e POSTGRES_PASSWORD=bookhub_secret -e POSTGRES_DB=bookhub -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend disponible en: `http://localhost:8082`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en: `http://localhost:3000`

## 📱 Categorías de Negocio

| Categoría              | Emoji | Descripción                               |
| ---------------------- | ----- | ----------------------------------------- |
| Barbería               | ✂️    | Cortes, afeitados, tratamientos capilares |
| Salón de Belleza       | 💇‍♀️    | Peinados, coloración, tratamientos        |
| Manicura/Pedicura      | 💅    | Uñas, nail art, spa de manos/pies         |
| Spa                    | 🧖    | Masajes, tratamientos corporales          |
| Autolavado             | 🚗    | Lavado de vehículos                       |
| Peluquería de Mascotas | 🐕    | Grooming, baño, corte                     |
| Estudio de Tatuajes    | 🎨    | Tatuajes, piercings                       |
| Otro                   | 📍    | Otros servicios                           |

## 🗄️ Modelo de Datos

### Entidades Principales

- **User**: Usuarios del sistema (email, rol, perfil)
- **Business**: Negocios/establecimientos
- **Service**: Servicios ofrecidos por cada negocio
- **Worker**: Trabajadores vinculados a negocios
- **Appointment**: Citas agendadas

### Roles de Usuario

- `OWNER`: Dueño de negocio
- `WORKER`: Trabajador/empleado
- `CLIENT`: Cliente

## 📞 API Endpoints (WIP)

| Método | Endpoint                 | Descripción         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/health`            | Estado del servidor |
| GET    | `/api/businesses/search` | Buscar negocios     |
| GET    | `/api/businesses/{id}`   | Detalle de negocio  |
| POST   | `/api/auth/register`     | Registro de usuario |
| POST   | `/api/auth/login`        | Inicio de sesión    |

## 📄 Licencia

MIT © 2026 BookHub
