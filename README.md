# React + TypeScript + Vite

# This app was tested on Node.js v22.15.0 & npm 10.9.2.

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `roundup-app` directory:
   ```
   STARLING_ACCESS_TOKEN=your_starling_sandbox_token_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Testing

Run tests with:
```bash
npm run test:run
```

## Security Notes

- For the purpose of this tech challenge, only basic access token authentication is implemented without refresh token functionality
- **Development only**: Token handling is configured for local development only, not for production deployment
- The access token is stored in `.env.local` (not committed to git)
- The token never appears in the client-side bundle
- CORS issues are handled by the Vite dev proxy

## API Endpoints Used

- `GET /api/v2/accounts` - Retrieve customer accounts
- `GET /api/v2/feed/account/{accountUid}/category/{categoryUid}/transactions-between` - Get transactions
- `GET /api/v2/account/{accountUid}/savings-goals` - List savings goals
- `PUT /api/v2/account/{accountUid}/savings-goals` - Create savings goal
- `PUT /api/v2/account/{accountUid}/savings-goals/{savingsGoalUid}/add-money/{transferUid}` - Transfer money to saving
