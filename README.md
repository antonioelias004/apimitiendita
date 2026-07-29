# API MiTiendita

API REST del proyecto NoSQL: backend en Node.js + Express con MongoDB (Mongoose)
y autenticación por token JWT.

## Requisitos

- Node.js 18 o superior
- Una base de datos MongoDB (Atlas o local)

## Instalación

```bash
npm install
```

## Configuración

Copia el archivo de ejemplo y rellena tus valores:

```bash
cp .env.example .env
```

Variables necesarias:

| Variable       | Descripción                                        |
| -------------- | -------------------------------------------------- |
| `MONGODB_URI`  | Cadena de conexión de MongoDB                      |
| `JWT_SECRET`   | Clave para firmar los tokens (larga y aleatoria)   |
| `PORT`         | Puerto local (opcional, por defecto 3000)          |

El servidor no arranca si falta `MONGODB_URI` o `JWT_SECRET`.

## Ejecución

```bash
npm run dev    # con recarga automática (nodemon)
npm start      # normal
```

Queda en `http://localhost:3000`.

## Autenticación

Todas las rutas están protegidas salvo `GET /` y `POST /login`.

1. `POST /login` con `{ "usuario": "...", "password": "..." }` devuelve un token.
2. Manda ese token en cada petición: `Authorization: Bearer <token>`

Los tokens duran 8 horas.

## Endpoints

| Recurso       | Rutas                                                        |
| ------------- | ------------------------------------------------------------ |
| Login         | `POST /login`                                                |
| Empleados     | `GET|POST /empleados` · `GET|PUT|DELETE /empleados/:id`       |
| Clientes      | `GET|POST /clientes` · `GET|PUT|DELETE /clientes/:id`         |
| Proveedores   | `GET|POST /proveedores` · `GET|PUT|DELETE /proveedores/:id`   |
| Productos     | `GET|POST /productos` · `GET|PUT|DELETE /productos/:id`       |
| Ventas        | `GET|POST /ventas` · `GET|PUT|DELETE /ventas/:id`             |

## Despliegue en Vercel

El archivo `vercel.json` ya está configurado. Antes de desplegar hay que dar de
alta `MONGODB_URI` y `JWT_SECRET` en *Settings → Environment Variables* del
proyecto en Vercel, porque no se suben en el repositorio.

## Frontend

El cliente web vive en el repositorio
[ProyectoNoSQL](https://github.com/antonioelias004/ProyectoNoSQL), carpeta `Frontend/`.
