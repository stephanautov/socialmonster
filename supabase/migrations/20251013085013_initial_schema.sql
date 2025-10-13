-- Migration: Initial schema
-- Generated: 2025-10-13T08:50:13.235Z

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============= TABLES =============
-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  emailVerified BOOLEAN NOT NULL,
  accountCreatedDate TIMESTAMP NOT NULL,
  subscriptionTier TEXT NOT NULL,
  lastLoginDate TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: socialmediaconnections
CREATE TABLE IF NOT EXISTS public.socialmediaconnections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  platform TEXT NOT NULL,
  platformAccountId TEXT NOT NULL,
  platformUsername TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  tokenExpiryDate TIMESTAMP NOT NULL,
  connectedDate TIMESTAMP NOT NULL,
  isActive BOOLEAN NOT NULL,
  lastSyncDate TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.socialmediaconnections ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_socialmediaconnections_updated_at
  BEFORE UPDATE ON public.socialmediaconnections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: brandprojects
CREATE TABLE IF NOT EXISTS public.brandprojects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  projectName TEXT NOT NULL,
  companyName TEXT NOT NULL,
  companyDescription TEXT NOT NULL,
  nameSignificance TEXT NOT NULL,
  designPersonality TEXT NOT NULL,
  targetAudience TEXT NOT NULL,
  colorDirection TEXT NOT NULL,
  typographyPreferences TEXT NOT NULL,
  competitiveExamples TEXT NOT NULL,
  desiredAssetTypes TEXT NOT NULL,
  createdDate TIMESTAMP NOT NULL,
  lastModifiedDate TIMESTAMP NOT NULL,
  isActive BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.brandprojects ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_brandprojects_updated_at
  BEFORE UPDATE ON public.brandprojects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: brandassets
CREATE TABLE IF NOT EXISTS public.brandassets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brandProjectId TEXT NOT NULL,
  assetType TEXT NOT NULL,
  assetName TEXT NOT NULL,
  fileUrl VARCHAR(255) NOT NULL,
  fileFormat TEXT NOT NULL,
  generationPrompt TEXT NOT NULL,
  generatedDate TIMESTAMP NOT NULL,
  version INTEGER NOT NULL,
  isApproved BOOLEAN NOT NULL,
  parentAssetId TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.brandassets ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_brandassets_updated_at
  BEFORE UPDATE ON public.brandassets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: contentposts
CREATE TABLE IF NOT EXISTS public.contentposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  brandProjectId TEXT,
  contentText TEXT NOT NULL,
  contentTopic TEXT NOT NULL,
  toneStyle TEXT NOT NULL,
  generationPrompt TEXT NOT NULL,
  mediaAttachments VARCHAR(255) NOT NULL,
  createdDate TIMESTAMP NOT NULL,
  lastEditedDate TIMESTAMP NOT NULL,
  status TEXT NOT NULL,
  wasAiGenerated BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.contentposts ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_contentposts_updated_at
  BEFORE UPDATE ON public.contentposts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: scheduledposts
CREATE TABLE IF NOT EXISTS public.scheduledposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contentPostId TEXT NOT NULL,
  socialMediaConnectionId TEXT NOT NULL,
  platform TEXT NOT NULL,
  scheduledDateTime TIMESTAMP NOT NULL,
  platformSpecificContent TEXT NOT NULL,
  publishStatus TEXT NOT NULL,
  publishedDateTime TIMESTAMP NOT NULL,
  platformPostId TEXT NOT NULL,
  errorMessage TEXT NOT NULL,
  retryCount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.scheduledposts ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_scheduledposts_updated_at
  BEFORE UPDATE ON public.scheduledposts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: contentoptimizations
CREATE TABLE IF NOT EXISTS public.contentoptimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  originalContent TEXT NOT NULL,
  optimizedContent TEXT NOT NULL,
  optimizationType TEXT NOT NULL,
  targetPlatform TEXT NOT NULL,
  optimizationPrompt TEXT NOT NULL,
  optimizedDate TIMESTAMP NOT NULL,
  wasAccepted BOOLEAN NOT NULL,
  resultingContentPostId TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.contentoptimizations ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_contentoptimizations_updated_at
  BEFORE UPDATE ON public.contentoptimizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: apiusages
CREATE TABLE IF NOT EXISTS public.apiusages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  apiProvider TEXT NOT NULL,
  apiEndpoint TEXT NOT NULL,
  requestType TEXT NOT NULL,
  tokensUsed INTEGER NOT NULL,
  requestTimestamp TIMESTAMP NOT NULL,
  responseStatus TEXT NOT NULL,
  costAmount INTEGER NOT NULL,
  relatedEntityId TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.apiusages ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_apiusages_updated_at
  BEFORE UPDATE ON public.apiusages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: assetdownloads
CREATE TABLE IF NOT EXISTS public.assetdownloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId TEXT NOT NULL,
  brandAssetId TEXT NOT NULL,
  downloadFormat TEXT NOT NULL,
  downloadDate TIMESTAMP NOT NULL,
  fileSize INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.assetdownloads ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_assetdownloads_updated_at
  BEFORE UPDATE ON public.assetdownloads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============= INDEXES =============


-- ============= RLS POLICIES =============
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "socialmediaconnections_select_all" ON public.socialmediaconnections
  FOR SELECT USING (true);

CREATE POLICY "brandprojects_select_all" ON public.brandprojects
  FOR SELECT USING (true);

CREATE POLICY "brandassets_select_all" ON public.brandassets
  FOR SELECT USING (true);

CREATE POLICY "contentposts_select_all" ON public.contentposts
  FOR SELECT USING (true);

CREATE POLICY "scheduledposts_select_all" ON public.scheduledposts
  FOR SELECT USING (true);

CREATE POLICY "contentoptimizations_select_all" ON public.contentoptimizations
  FOR SELECT USING (true);

CREATE POLICY "apiusages_select_all" ON public.apiusages
  FOR SELECT USING (true);

CREATE POLICY "assetdownloads_select_all" ON public.assetdownloads
  FOR SELECT USING (true);