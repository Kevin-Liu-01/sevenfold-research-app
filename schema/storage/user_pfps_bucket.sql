-- Create storage bucket for user profile pictures
-- This script should be run in your Supabase SQL editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user_pfps',
    'user_pfps',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user_pfps' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policy for authenticated users to view profile pictures
CREATE POLICY "Users can view profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'user_pfps');

-- Create storage policy for users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user_pfps' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policy for users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user_pfps' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
