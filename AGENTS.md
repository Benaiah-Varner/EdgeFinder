# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Edge Finder is a Next.js application that appears to be in early development. It's designed as a trading platform with planned features for trade journaling, stock screening, and backtesting strategies.

## Repository Structure

The repository is organized with a front-end directory containing a Next.js application:

```
/
├── front-end/           # Next.js application
    ├── app/             # Next.js app router components
    ├── theme/           # MUI theme customization
    ├── components/      # Reusable React components (to be implemented)
    └── public/          # Static assets
|-- access-control
    |-- app.ts           # where the API is created and routes are defined, controllers imported
    |-- controllers/     # for the login, update, notebook REST controller functions
    |-- schemas/         # Schemas for postgres database, user and trade schema
    |-- migrations/      # Postgres migrations
```

## Development Commands

```bash
# Navigate to the front-end directory
cd front-end

# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Technology Stack

- **Framework**: Next.js 15.3.3 with App Router
- **UI Library**: Material UI (MUI) 7.1.0
- **Styling**: Emotion for styled components
- **Languages**: TypeScript, React 19
- **Development**: ESLint for code quality

## Architecture Notes

The application uses:
- Next.js App Router for routing and page structure
- Material UI components for the user interface
- A custom theme defined in `theme/edgeFinderTheme.ts`
- Geist font family for typography

## Implementation Guidelines

1. **Component Structure**: When creating new components, follow Material UI patterns and use Emotion for styling if needed.

2. **Theming**: Use the MUI theme provider and the custom theme defined in `edgeFinderTheme.ts` for consistent styling.

3. **TypeScript**: Ensure proper typing for all components and functions.

4. **App Router**: Follow Next.js App Router conventions for new pages and layouts.

According to the existing AGENTS.md in the front-end directory, the application aims to build a full-stack trading platform with:
- Journal features for trade tracking
- Stock screening functionality
- Backtesting capabilities
- AI-driven insights

# Journal Page
- Should be the landing page on the site after authentication 
- Should have a table, with each row being an uploaded trade. 
- Above the table there should be a win rate card, and an "R/R" card.
- There should be a button that says "Add new trade"
- Each table row should have a checkbox that can be selected
- When "Add new trade" is clicked, a modal appears with entry/exit inputs, an input to select entry/exit date, a field to upload image file, and a text area to write a description.
- There should be filters available for date. It should be a dropdown that includes all 12 months of the year, with the given year as well. If June 2025 is selected, the journal should filter the trades by date, and only show trades that have an entryDate during June 2025. The win rate should also update and use this filtered list. In addition to all 12 months, there should be an option for "All time" which should show all trades.

# Strategy Page
- Create a strategy page that pulls all strategies associated with a given user. It should be a list of strategies, and then look through the trades associated with the strategies, and show the following statistics: Win rate, total P/L, average winner gain and average loser loss.
- Pull the data from the /strategies endpoint, using the following function:
```
 const response = await fetch('http://localhost:3001/strategies', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let the browser set it with the boundary for multipart/form-data
        },
        credentials: 'include',
      });
```
- The strategy and trade models are as follows:
```
model User {
  id         String     @id @default(cuid())
  email      String     @unique
  password   String
  firstName  String?
  lastName   String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  strategies Strategy[]
  trades     Trade[]

  @@map("users")
}

model Trade {
  id          String    @id @default(cuid())
  userId      String
  symbol      String
  entryPrice  Float
  exitPrice   Float?
  quantity    Int
  entryDate   DateTime
  exitDate    DateTime?
  tradeType   TradeType @default(LONG)
  imageUrl    String?
  description String?
  pnl         Float?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  strategyId  String?
  strategy    Strategy? @relation(fields: [strategyId], references: [id])
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("trades")
}

model Strategy {
  id          String  @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades      Trade[]

  @@map("strategies")
}
```
- And here is a sample response from the strategy endpoint, so you can properly access properties and display the proper information:
{
    "strategies": [
        {
            "id": "cmcnp1k39000013510aux9ka0",
            "name": "Break N Retest",
            "description": "Strategy: Pullback",
            "userId": "cmcdxp6ds0002xrtu4pdad5ux",
            "trades": [
                {
                    "id": "cmcnp1k7d00021351szlxhrmb",
                    "userId": "cmcdxp6ds0002xrtu4pdad5ux",
                    "symbol": "LLY",
                    "entryPrice": 650,
                    "exitPrice": 365,
                    "quantity": 1,
                    "entryDate": "2025-06-17T04:00:00.000Z",
                    "exitDate": "2025-06-18T04:00:00.000Z",
                    "tradeType": "LONG",
                    "imageUrl": "/uploads/image-1751565782925-239437805.png",
                    "description": "Tested the pullback, should have had much tighter stop",
                    "pnl": -285,
                    "createdAt": "2025-07-03T18:03:03.414Z",
                    "updatedAt": "2025-07-03T18:03:03.414Z",
                    "strategyId": "cmcnp1k39000013510aux9ka0"
                }
            ]
        },
        {
            "id": "cmcnp95kt000057n5nge68jwm",
            "name": "Bullish Divergence",
            "description": "Strategy: Support/Resistance",
            "userId": "cmcdxp6ds0002xrtu4pdad5ux",
            "trades": [
                {
                    "id": "cmcnzoswa000112ev3di0mkyu",
                    "userId": "cmcdxp6ds0002xrtu4pdad5ux",
                    "symbol": "STZ",
                    "entryPrice": 915,
                    "exitPrice": 825,
                    "quantity": 1,
                    "entryDate": "2025-06-18T04:00:00.000Z",
                    "exitDate": "2025-07-24T04:00:00.000Z",
                    "tradeType": "LONG",
                    "imageUrl": "/uploads/image-1751583663531-836704623.png",
                    "description": "Oversold RSI at support, kind of divergent, nice price action and tight risk at this level. Ended up selling for a small loss but if I held it would have been a big win.",
                    "pnl": -90,
                    "createdAt": "2025-07-03T23:01:03.941Z",
                    "updatedAt": "2025-07-03T23:01:03.941Z",
                    "strategyId": "cmcnp95kt000057n5nge68jwm"
                },
                {
                    "id": "cmcnp95nq000257n54bgfmpxf",
                    "userId": "cmcdxp6ds0002xrtu4pdad5ux",
                    "symbol": "CNC",
                    "entryPrice": 380,
                    "exitPrice": 240,
                    "quantity": 1,
                    "entryDate": "2025-06-03T04:00:00.000Z",
                    "exitDate": "2025-06-23T04:00:00.000Z",
                    "tradeType": "LONG",
                    "imageUrl": "/uploads/image-1751566137325-429066792.png",
                    "description": "Was looking to catch a bounce off support, but it broke support and stopped me out. Ended up working out but glad I respected stop loss.",
                    "pnl": -140,
                    "createdAt": "2025-07-03T18:08:57.828Z",
                    "updatedAt": "2025-07-03T18:08:57.828Z",
                    "strategyId": "cmcnp95kt000057n5nge68jwm"
                }
            ]
        }
    ],
    "count": 2
}