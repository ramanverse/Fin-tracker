# Personal Finance Tracker

A web application to track your personal finances, including income, expenses, and budgets.

🚀 **Live Deployment:** [View on Render](https://fin-tracker-8bi4.onrender.com)

## Features
- User Authentication (Local & Google OAuth)
- Track Income and Expenses
- Receipt Uploads
- Category and Budget Management
- Notifications for Budget Overruns
- Dashboard with Visualizations
- **AI Bank Statement Import** (PDF/CSV parsing via OpenAI auto-categorization)
- **AI Anomaly Detection** (Identifies unusual spending habits using LLMs)
- Duplicate Transaction Detection

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

## Setup Instructions

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your database and other credentials:
   ```bash
   cp .env.example .env
   ```

3. Create the PostgreSQL database:
   ```bash
   createdb finance_tracker
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation
The API runs at `http://localhost:5000/api` by default.

## Testing
Run the test suite with:
```bash
npm test
```
