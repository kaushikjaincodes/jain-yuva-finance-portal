
# 🏦 Trust Management Dashboard

A comprehensive, full-stack Admin Dashboard built to manage a 50+ member financial trust. This portal automates the tracking of monthly contributions, loan installments, penalty calculations, and overall financial health using a serverless PostgreSQL database.

## ✨ Key Features

* **Secure Admin Authentication:** Protected routes with custom JWT session management and bcrypt password hashing.
* **Member Ledger Management:** Track "New" vs. "Old" members based on their total historical contributions.
* **Automated Loan Processing:** * Support for Normal (0.25%) and Temporary (1.00%) simple interest loans.
  * Tracks total installments, remaining dues, and automatically increments upon monthly payments.
* **Smart Penalty System:** * Escalating penalties for missed monthly contributions (₹10, ₹30, ₹70...).
  * Flat penalties for missed loan installments (₹500).
* **Financial Analytics:** Real-time dashboard showing Total Fund Size, Active Loans, and Monthly Income (Principal + Interest + Penalties).
* **Export & Reporting:** Generate downloadable PDF member ledgers and export table data to customizable Excel sheets.
* **Modern UI:** Fully responsive design with Light/Dark mode support.

## 🛠️ Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **UI Components:** [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
* **Database:** [Neon Serverless Postgres](https://neon.tech/) (`@neondatabase/serverless`)
* **Authentication:** `jose` (JWT) + `bcryptjs`
* **Forms & Validation:** React Hook Form + Zod
* **Utilities:** `jspdf` (PDF generation), `xlsx` (Excel exports), `recharts` (Data visualization)

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone [https://github.com/kaushikjaincodes/jain-yuva-finance-portal.git](https://github.com/kaushikjaincodes/jain-yuva-finance-portal.git)
cd trust-management-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Database Connection (Ensure you use the pooled connection string starting with ep-)
DATABASE_URL="postgresql://user:password@ep-your-endpoint.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Secret key for JWT session tokens (generate a random string)
JWT_SECRET="your_super_secret_jwt_key_here"
```

### 4. Database Setup
This project uses raw SQL queries via the Neon serverless driver. To initialize your database:
1. Open your [Neon Dashboard](https://console.neon.tech/).
2. Navigate to the **SQL Editor**.
3. Copy the contents of `scripts/001-create-tables.sql` and run it to create the tables and default admin account.
4. *(Optional)* Run the historical data scripts (e.g., April 2026 data) to populate the initial state.

**Default Admin Credentials:**
* **Email:** `admin@bachaat.com`
* **Password:** `admin123`

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (Pages, API Routes, Layouts)
│   ├── api/              # API endpoints (Auth, Data fetching)
│   ├── dashboard/        # Protected Admin Dashboard routes
│   └── globals.css       # Global Tailwind styles
├── components/           # Reusable React components (UI, Forms, Tables)
├── lib/                  # Utility functions
│   ├── db.ts             # Neon database connection setup
│   └── auth.ts           # JWT and session management logic
├── scripts/              # SQL scripts for DB initialization and migrations
├── .env.local            # Local environment variables (ignored by git)
└── package.json          # Project dependencies
```

## 🔮 Future Enhancements
* **Automated Email Notifications:** Integration with Resend/Nodemailer to automatically dispatch monthly PDF ledgers to members via email.
* **Cron Jobs:** Automated execution of the monthly rollover process on the 1st of every month.

## 📄 License
This project is licensed under the MIT License.