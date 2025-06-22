/*
  # Create appointments table

  1. New Tables
    - `appointments`
      - `id` (bigint, primary key, auto-increment)
      - `date` (date, required)
      - `type` (text, required) - Type of appointment (e.g., "Dental Cleaning", "Eye Exam")
      - `provider` (text, required) - Healthcare provider name
      - `duration` (text, required) - Duration of appointment (e.g., "60 minutes")
      - `estimated_cost` (text, required) - Cost information including insurance details
      - `status` (text, required, default 'proposed') - Appointment status
      - `category` (text, required) - Category of appointment (dental, vision, physio, etc.)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `appointments` table
    - Add policy for authenticated users to manage their own appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  duration TEXT NOT NULL,
  estimated_cost TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their appointments
CREATE POLICY "Users can manage their own appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_category ON appointments(category);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Insert sample data to match the existing sample appointments
INSERT INTO appointments (date, type, provider, duration, estimated_cost, status, category) VALUES
  ('2025-01-15', 'Dental Cleaning', 'Dr. Michael Rodriguez', '60 minutes', '$120 (after insurance)', 'proposed', 'dental'),
  ('2025-01-28', 'Eye Exam', 'Dr. Amanda Foster', '45 minutes', '$0 (fully covered)', 'proposed', 'vision'),
  ('2025-03-10', 'Physiotherapy Assessment', 'Dr. Sarah Chen', '45 minutes', '$0 (fully covered)', 'proposed', 'physio'),
  ('2025-04-22', 'Massage Therapy', 'Lisa Thompson', '60 minutes', '$25 (after insurance)', 'proposed', 'massage'),
  ('2025-06-18', 'Dental Cleaning', 'Dr. Michael Rodriguez', '60 minutes', '$120 (after insurance)', 'proposed', 'dental'),
  ('2025-06-25', 'Annual Physical', 'Dr. Jennifer Kim', '30 minutes', '$0 (fully covered)', 'proposed', 'medical'),
  ('2025-08-14', 'Physiotherapy Follow-up', 'Dr. Sarah Chen', '30 minutes', '$0 (fully covered)', 'proposed', 'physio'),
  ('2025-09-20', 'Massage Therapy', 'Lisa Thompson', '60 minutes', '$25 (after insurance)', 'proposed', 'massage'),
  ('2025-11-12', 'Eye Exam', 'Dr. Amanda Foster', '45 minutes', '$0 (fully covered)', 'proposed', 'vision'),
  ('2025-11-26', 'Dental Cleaning', 'Dr. Michael Rodriguez', '60 minutes', '$120 (after insurance)', 'proposed', 'dental'),
  ('2025-12-15', 'Annual Physical Follow-up', 'Dr. Jennifer Kim', '20 minutes', '$0 (fully covered)', 'proposed', 'medical');