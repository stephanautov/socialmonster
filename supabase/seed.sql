-- Seed data for development
-- Generated: 2025-10-13T08:50:13.236Z

-- Fixed timestamp for deterministic seeds
DO $$
DECLARE
  fixed_time TIMESTAMP := '2024-01-01 00:00:00'::timestamp;
BEGIN
  -- Seed data goes here
END $$;

-- Seed data for socialmediaconnections
INSERT INTO public.socialmediaconnections (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for brandprojects
INSERT INTO public.brandprojects (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for brandassets
INSERT INTO public.brandassets (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for contentposts
INSERT INTO public.contentposts (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for scheduledposts
INSERT INTO public.scheduledposts (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for contentoptimizations
INSERT INTO public.contentoptimizations (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for apiusages
INSERT INTO public.apiusages (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;

-- Seed data for assetdownloads
INSERT INTO public.assetdownloads (id, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '2024-01-01 00:00:00'::timestamp, '2024-01-01 00:00:00'::timestamp)
ON CONFLICT DO NOTHING;