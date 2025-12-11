# PostgreSQL Database Setup

## Prerequisites
1. Install PostgreSQL on your local machine
   - Windows: Download from https://www.postgresql.org/download/windows/
   - During installation, remember the password you set for the `postgres` user

## Setup Steps

### 1. Create the Database
Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE invoices_db;
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` folder (copy from `.env.example`):

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=invoices_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
PORT=4000
```

Replace `your_postgres_password` with your actual PostgreSQL password.

### 3. Install dotenv (optional but recommended)
```bash
npm install dotenv
```

Then add this line at the top of `server.js`:
```javascript
require('dotenv').config();
```

### 4. Start the Server
The database table will be created automatically when you start the server:

```bash
node server.js
```

## Verify Setup
The server will create the `invoices` table automatically on startup. You should see:
```
Database initialized successfully
Invoice backend running on http://localhost:4000
```

## Database Schema
The `invoices` table has the following structure:
- `id` (VARCHAR) - Primary key
- `created_at` (TIMESTAMP) - Invoice creation date
- `seller` (JSONB) - Seller information
- `client` (JSONB) - Client information
- `items` (JSONB) - Invoice line items
- `tax_percent` (DECIMAL) - Tax percentage
- `discount` (DECIMAL) - Discount amount
- `notes` (TEXT) - Additional notes
- `subtotal` (DECIMAL) - Subtotal amount
- `tax` (DECIMAL) - Tax amount
- `total` (DECIMAL) - Total amount
