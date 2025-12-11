# Invoice Generator

A professional full-stack invoice generator application built with React and Node.js.

## Features

- 📄 Generate professional PDF invoices
- 💼 Manage seller and client information
- 📊 Add multiple items with quantity and pricing
- 💰 Calculate tax and discounts automatically
- 📥 Download invoices as PDF
- 🗄️ Store invoice data in PostgreSQL database

## Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Axios

**Backend:**
- Node.js
- Express
- PostgreSQL
- PDFKit

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
copy .env.example .env
```

4. Update `.env` with your PostgreSQL credentials:
```
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=invoices_db
DB_PASSWORD=your_password
DB_PORT=5432
PORT=4000
```

5. Start the backend server:
```bash
node server.js
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## Usage

1. Fill in your business information (seller details)
2. Add client information
3. Add invoice items with descriptions, quantities, and prices
4. Set tax percentage and discount (optional)
5. Add notes (optional)
6. Click "Generate & Download PDF" to create and download the invoice

## API Endpoints

- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id/pdf` - Download invoice PDF

## License

MIT
