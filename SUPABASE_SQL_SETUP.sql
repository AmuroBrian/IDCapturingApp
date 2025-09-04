-- ============================================
-- SUPABASE SQL SETUP FOR PHOTO CAPTURE APP
-- ============================================
-- Copy and paste these queries into Supabase SQL Editor
-- Run them one by one or all at once

-- 1. CREATE PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 3. CREATE POLICIES FOR PUBLIC ACCESS
-- ============================================

-- Allow anyone to view photos
CREATE POLICY "Public photos are viewable by everyone" 
ON photos FOR SELECT 
TO public 
USING (true);

-- Allow anyone to upload photos
CREATE POLICY "Anyone can upload photos" 
ON photos FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow anyone to delete photos (optional - for admin features)
CREATE POLICY "Anyone can delete photos" 
ON photos FOR DELETE 
TO public 
USING (true);

-- 4. CREATE STORAGE BUCKET (Run this if bucket doesn't exist)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. CREATE STORAGE POLICIES
-- ============================================

-- Allow public uploads to photos bucket
CREATE POLICY "Anyone can upload photos to bucket" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'photos');

-- Allow public downloads from photos bucket
CREATE POLICY "Anyone can view photos in bucket" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'photos');

-- Allow public deletes from photos bucket (optional)
CREATE POLICY "Anyone can delete photos from bucket" 
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id = 'photos');

-- 6. ENABLE REALTIME FOR PHOTOS TABLE
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE photos;

-- 7. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS photos_filename_idx ON photos(filename);

-- ============================================
-- VERIFICATION QUERIES (Optional - to test)
-- ============================================

-- Check if table was created successfully
SELECT * FROM photos LIMIT 5;

-- Check if policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'photos';

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'photos';

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert test data:

-- INSERT INTO photos (filename, url, file_path, size) VALUES 
-- ('test_photo_1.jpg', 'https://example.com/photo1.jpg', 'test_photo_1.jpg', 1024000),
-- ('test_photo_2.jpg', 'https://example.com/photo2.jpg', 'test_photo_2.jpg', 2048000);

-- ============================================
-- CLEANUP QUERIES (Use only if needed)
-- ============================================
-- Uncomment these if you need to reset everything:

-- DROP TABLE IF EXISTS photos CASCADE;
-- DELETE FROM storage.objects WHERE bucket_id = 'photos';
-- DELETE FROM storage.buckets WHERE id = 'photos';
