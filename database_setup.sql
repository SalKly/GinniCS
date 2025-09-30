-- Database schema for the Ginni Form system
-- Run this in your Supabase SQL editor

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forms table (renamed from blueprints for clarity)
CREATE TABLE IF NOT EXISTS forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    tree_url VARCHAR(500), -- URL to the visual tree
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_forms_company_id ON forms(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (uncomment if you want to enable RLS)
-- CREATE POLICY "Enable read access for all users" ON companies FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON companies FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON companies FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON companies FOR DELETE USING (true);

-- CREATE POLICY "Enable read access for all users" ON forms FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON forms FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON forms FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON forms FOR DELETE USING (true);

-- Insert some sample data (optional)
-- INSERT INTO companies (name, website) VALUES 
--   ('Sample Company', 'https://example.com'),
--   ('Test Corp', 'https://test.com')
-- ON CONFLICT (name) DO NOTHING;
