ALTER TABLE public.name_change_requests ADD COLUMN IF NOT EXISTS proof_document_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('name-change-proofs', 'name-change-proofs', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Residents can upload name change proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'name-change-proofs');

CREATE POLICY "Anyone can view name change proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'name-change-proofs');