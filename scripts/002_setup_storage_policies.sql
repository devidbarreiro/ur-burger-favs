-- Storage bucket for burger images
INSERT INTO storage.buckets (id, name, public)
VALUES ('burger-images', 'burger-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'burger-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'burger-images');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'burger-images');

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'burger-images');
