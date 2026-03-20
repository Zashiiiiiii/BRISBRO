INSERT INTO public.staff_users (username, full_name, password_hash, role, is_active)
VALUES ('admin', 'System Administrator', '$2a$10$rQEY0tEMG9bPMj1qL0D5aOyfGmKqKGjXGqH5G9PpN1aMRD.JOvXK2', 'admin', true)
ON CONFLICT (username) DO NOTHING;