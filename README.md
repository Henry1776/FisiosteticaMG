# Website con Sistema de Reservas

Un sitio web completo con sistema de reservas desarrollado con HTML5, CSS3 (Tailwind), JavaScript y Node.js con MySQL.

## Características

- **Frontend**: HTML5, CSS3 con Tailwind, JavaScript vanilla
- **Backend**: Node.js con Express
- **Base de datos**: MySQL
- **Colores**: Púrpura, verde y blanco
- **Páginas**: Inicio, Nosotros, Servicios, Contacto, Reservas
- **Funcionalidades**:
  - Sistema de reservas completo
  - Formulario de contacto
  - Diseño responsive
  - Validación de formularios
  - API REST para gestión de datos

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura la base de datos:
   - Crea una base de datos MySQL
   - Ejecuta el script `database/schema.sql`
   - Configura las variables de entorno en `.env`

4. Inicia el servidor:
   ```bash
   npm start
   ```
   
   Para desarrollo:
   ```bash
   npm run dev
   ```

## Configuración

Copia el archivo `.env.example` a `.env` y configura las variables:

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=booking_system
PORT=3000
```

## Estructura del Proyecto

```
├── index.html          # Página principal
├── about.html          # Página nosotros
├── services.html       # Página servicios
├── contact.html        # Página contacto
├── bookings.html       # Página reservas
├── js/
│   ├── main.js         # JavaScript principal
│   └── booking.js      # JavaScript para reservas
├── config/
│   └── database.js     # Configuración de base de datos
├── routes/
│   ├── bookings.js     # Rutas de reservas
│   └── contact.js      # Rutas de contacto
├── database/
│   └── schema.sql      # Esquema de base de datos
├── server.js           # Servidor principal
└── package.json        # Dependencias
```

## API Endpoints

### Reservas
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings` - Obtener todas las reservas
- `GET /api/bookings/:id` - Obtener reserva por ID
- `PATCH /api/bookings/:id/status` - Actualizar estado
- `GET /api/bookings/available/:date` - Horarios disponibles

### Contacto
- `POST /api/contact` - Enviar mensaje
- `GET /api/contact` - Obtener mensajes
- `PATCH /api/contact/:id/read` - Marcar como leído

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, Tailwind CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Base de datos**: MySQL
- **Validación**: Express Validator
- **Seguridad**: Helmet, CORS, Rate Limiting

## Licencia

MIT License
