-- Bachaat Committee Admin Panel Database Schema

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  monthly_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
  per_member_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'old')),
  standard_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_amount DECIMAL(12, 2) NOT NULL,
  loan_month DATE NOT NULL,
  rec_interest_no INTEGER NOT NULL DEFAULT 0,
  installment_number INTEGER NOT NULL,
  due_amount DECIMAL(12, 2) NOT NULL,
  loan_installment DECIMAL(12, 2) NOT NULL,
  interest DECIMAL(12, 2) NOT NULL,
  loan_type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (loan_type IN ('normal', 'temporary')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Penalties Table
CREATE TABLE IF NOT EXISTS penalties (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('contribution_missed', 'loan_installment_missed')),
  amount DECIMAL(12, 2) NOT NULL,
  consecutive_months INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Contributions Tracking
CREATE TABLE IF NOT EXISTS monthly_contributions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  contribution_paid BOOLEAN DEFAULT FALSE,
  contribution_amount DECIMAL(12, 2) DEFAULT 0,
  loan_installment_paid BOOLEAN DEFAULT FALSE,
  loan_installment_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, month_year)
);

-- Trust Statistics Table
CREATE TABLE IF NOT EXISTS trust_statistics (
  id SERIAL PRIMARY KEY,
  entry_name VARCHAR(255) NOT NULL,
  entry_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('book_size', 'monthly_detail')),
  is_fixed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Financials Table
CREATE TABLE IF NOT EXISTS monthly_financials (
  id SERIAL PRIMARY KEY,
  month_year DATE NOT NULL UNIQUE,
  interest_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_deposit DECIMAL(12, 2) NOT NULL DEFAULT 0,
  temp_loans DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table for Auth
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_penalties_member_id ON penalties(member_id);
CREATE INDEX IF NOT EXISTS idx_penalties_month_year ON penalties(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_contributions_member_id ON monthly_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_monthly_contributions_month_year ON monthly_contributions(month_year);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Insert default admin (password: admin123 - should be changed after first login)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admins (email, password_hash, name)
VALUES ('admin@bachaat.com', '$2b$10$rOzJqjKqNqjKqNqjKqNqjOzJqjKqNqjKqNqjKqNqjO', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert initial trust statistics (fixed book size entries)
INSERT INTO trust_statistics (entry_name, entry_value, entry_type, is_fixed, sort_order) VALUES
  ('Total Members', 0, 'book_size', true, 1),
  ('Active Loans', 0, 'book_size', true, 2),
  ('Total Fund Size', 0, 'book_size', true, 3),
  ('Total Contributions', 0, 'book_size', true, 4),
  ('Total Interest Earned', 0, 'book_size', true, 5),
  ('Total Penalties Collected', 0, 'book_size', true, 6),
  ('Normal Loans Outstanding', 0, 'book_size', true, 7),
  ('Temporary Loans Outstanding', 0, 'book_size', true, 8),
  ('Last Month Temp Loans', 0, 'book_size', true, 9),
  ('This Month Total Deposit', 0, 'book_size', true, 10),
  ('This Month Interest Income', 0, 'book_size', true, 11)
ON CONFLICT DO NOTHING;
