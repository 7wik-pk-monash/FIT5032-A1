# FIT5032-A1 : TeamUp

TeamUp is a community-focused platform that promotes health and well-being through participation in sports, particularly for underrepresented individuals and those with physical or mental challenges. Users can discover, join, or create activities tailored to their needs, while visual maps and filtering tools make event access easy and intuitive. The platform also supports community contributions through donations for sports equipment and encourages sustained engagement with gamified rewards, creating a fun, inclusive, and supportive environment for everyone.

Built by Sathwik P. Kallapur (Monash University Clayton Campus, student ID 34556834)

## Testing Business Requirements C.1-3
To login as a normal user, register a new user with the appropriate credentials.
To login as admin, provide the following credentials:
email: admin@mailinator.com
password: Admin123!

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Hot-Reload for Development (With External Endpoints - described below)

```sh
npm run dev:full
```

### Compile and Minify for Production

```sh
npm run build
```

### Build and Run Full Application in Production

```sh
npm run build:full
```

This command builds the Vue application for production and starts both the Vue app (on port 4173) and Express API server (on port 3001) together.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## API Server

The project includes an Express.js API server that provides external endpoints for accessing TeamUp data and for submitting (mock) donations.
 
### Start API Server

```sh
# Start API server only
node api-server-simple.js

# Start both Vue app and API server concurrently (development)
npm run dev:full

# Build and start both Vue app and API server (production)
npm run build:full
```

### API Endpoints

- **Health Check**: `GET /api/health`
- **Get All Activities**: `GET /api/activities?limit=10`
- **Get Nearby Activities**: `GET /api/activities/nearby?lat=37.7749&lng=-122.4194&limit=5`
- **Process Donation**: `POST /api/donations`

**Base URL**: `http://localhost:3001`

For complete API documentation with examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Quick API Test

```sh
# Health check
curl "http://localhost:3001/api/health"

# Get nearby activities
curl "http://localhost:3001/api/activities/nearby?lat=-37.78901304581446&lng=144.98125371269705&limit=5"

# Process donation
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{"donorName":"Test User","donorEmail":"test@example.com","donationAmount":50.00}'
```
