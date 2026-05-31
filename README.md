# TEAM SOCCER — Guía de instalación local

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Node.js** | 18+ | https://nodejs.org |
| **Docker Desktop** | cualquiera | https://www.docker.com/products/docker-desktop |

> Las librerías JS del frontend (Chart.js, html2canvas, jsPDF, QRCode, Google Fonts)
> se cargan **desde internet (CDN)** — no necesitas instalar nada extra para ellas.
> Solo la base de datos corre localmente.

---

## Estructura del proyecto

```
team-soccer-local/
├── docker-compose.yml      ← levanta PostgreSQL en Docker
├── start.sh                ← script de arranque (Mac/Linux)
├── backend/
│   ├── server.js           ← API Express (corre en puerto 3001)
│   ├── package.json
│   └── schema.sql          ← esquema de la BD (se aplica automáticamente)
└── frontend/               ← los HTML/CSS/JS del proyecto
    ├── login/
    ├── menu/
    ├── equipos/
    ├── jugadores/
    ├── rol/
    ├── puntos/
    ├── horarios/
    └── graficas/
```

---

## Pasos de instalación

### 1. Instala Node.js y Docker Desktop
Descárgalos e instálalos desde los links de la tabla de arriba.

### 2. Abre una terminal en esta carpeta

```bash
cd ruta/a/team-soccer-local
```

### 3. Levanta la base de datos (PostgreSQL en Docker)

```bash
docker compose up -d
```

Esto descarga la imagen de Postgres, crea la base de datos `teamsoccer`
y aplica el esquema automáticamente. Solo necesitas hacerlo la primera vez
(después solo vuelves a arrancar el backend).

### 4. Instala las dependencias del backend

```bash
cd backend
npm install
```

### 5. Arranca el backend

```bash
node server.js
```

Deberías ver:
```
✅  Backend local corriendo en http://localhost:3001
```

### 6. Abre el frontend

Abre este archivo en tu navegador (Chrome recomendado):

```
frontend/login/index.html
```

**Credenciales de acceso:**
- Usuario: `jaguar`
- Contraseña: `jaguar123`

---

## Atajo: script todo-en-uno (Mac/Linux)

```bash
chmod +x start.sh
./start.sh
```

Esto hace los pasos 3, 5 automáticamente.

---

## Comandos útiles

| Qué quieres hacer | Comando |
|---|---|
| Detener la BD | `docker compose down` |
| Borrar todos los datos | `docker compose down -v` |
| Ver logs de la BD | `docker compose logs db` |
| Backend con auto-reload | `cd backend && npx nodemon server.js` |

---

## Variables de entorno del backend (opcionales)

Si ya tienes Postgres instalado localmente y no quieres usar Docker,
crea un archivo `backend/.env` con:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teamsoccer
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
PORT=3001
```

---

## ¿Cómo funciona?

```
Navegador
  │  abre archivos HTML/CSS/JS (file://)
  │  carga Chart.js, Fonts, etc. desde CDN (internet)
  │
  └──► http://localhost:3001  (backend Express)
              │
              └──► PostgreSQL en Docker  (solo en tu máquina)
```

El frontend ya fue modificado para apuntar a `http://localhost:3001`
en lugar del servidor Railway original.
