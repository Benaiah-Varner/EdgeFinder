# Edge Finder Access Control API

Node.js API for user authentication and trade journal management in the Edge Finder trading platform.

## Features

- User registration and authentication with JWT
- Trade journal CRUD operations
- Image upload for trade screenshots
- Trade statistics (win rate, risk/reward ratio)
- PostgreSQL database with Prisma ORM

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

3. Set up database:
```bash
npm run db:generate
npm run db:push
```

4. Create uploads directory:
```bash
mkdir uploads
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Trades (requires authentication)
- `GET /api/trades` - Get all trades and statistics
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade

### Health Check
- `GET /health` - Server health status

## Database Schema

### Users
- id, email, password, firstName, lastName, timestamps

### Trades
- id, userId, symbol, entry/exit prices, quantity, dates, type, status, image, description, P&L, timestamps