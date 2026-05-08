# InvoicePro — Premium Full-Stack Invoice Management System

> React.js + Node.js + MongoDB Atlas | Matches invoice-generator.com layout

---

## Folder Structure

```
Invoice/
├── backend/
│   ├── models/
│   │   └── Invoice.js          # Mongoose schema
│   ├── routes/
│   │   └── invoices.js         # All API endpoints + PDF proxy
│   ├── .env                    # ← Fill in your MongoDB URI
│   ├── .env.example
│   ├── index.js                # Express server entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx          # Top nav with tab switching
    │   │   ├── InvoiceForm.jsx     # Left panel — all form fields
    │   │   ├── InvoicePreview.jsx  # Right panel — live preview
    │   │   ├── LineItems.jsx       # Dynamic line items table
    │   │   ├── SummarySection.jsx  # Subtotal/Tax/Discount/Total
    │   │   └── HistoryView.jsx     # Invoice history dashboard
    │   ├── hooks/
    │   │   └── useInvoice.js       # All invoice state + calculations
    │   ├── services/
    │   │   └── api.js              # Axios API calls
    │   ├── utils/
    │   │   └── calculations.js     # Math helpers + currency
    │   ├── App.jsx                 # Root: action buttons + layout
    │   ├── index.css               # Tailwind + custom classes
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Quick Setup

### 1. MongoDB Atlas
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a free cluster
2. Under **Database Access** → add a user with a password
3. Under **Network Access** → add `0.0.0.0/0` (allow all IPs)
4. Click **Connect** → Drivers → copy the connection string

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — paste your MongoDB URI
nano .env

npm install
npm run dev        # starts on http://localhost:5000
```

**`.env` content:**
```
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/invoicedb?retryWrites=true&w=majority
PORT=5000
```

### 3. Frontend

```bash
# In a new terminal tab
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/generate-invoice` | Proxy to invoice-generator.com → returns PDF buffer |
| `POST` | `/api/invoices` | Save invoice to MongoDB |
| `GET` | `/api/invoices` | List all saved invoices |
| `GET` | `/api/invoices/:id` | Get single invoice |
| `DELETE` | `/api/invoices/:id` | Delete invoice |
| `GET` | `/health` | Health check |

---

## Features

- **Split-screen**: Form (left) + live real-time preview (right)
- **Logo upload**: Drag & drop or click to upload company logo
- **Dynamic line items**: Add/remove rows, auto-calculate amounts
- **Smart summary**: Tax (% or flat), Discount (% or flat), Shipping, Balance Due
- **PDF generation**: Proxied through invoice-generator.com
- **MongoDB history**: Save every invoice, view/reload/delete from dashboard
- **WhatsApp share**: Opens wa.me with formatted invoice text
- **Gmail share**: Opens Gmail compose with invoice summary
- **8 currencies**: USD, EUR, GBP, INR, CAD, AUD, JPY, CNY
- **Framer Motion** animations + **Lucide React** icons

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express, Multer, Axios, Form-Data |
| Database | MongoDB Atlas via Mongoose |
| PDF | invoice-generator.com REST API (proxy) |
