-- ============================================================================
-- Recommended Tools
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommended_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'AI',
    'Development',
    'Hosting',
    'Deployment',
    'Database',
    'Design',
    'Productivity',
    'Learning'
  )),
  destination_url TEXT NOT NULL,
  is_affiliate BOOLEAN DEFAULT false,
  is_sponsored BOOLEAN DEFAULT false,
  sponsor_name TEXT,
  sponsor_level TEXT,
  priority INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS recommended_tools_active_idx
  ON public.recommended_tools (is_active, priority DESC, display_order ASC);

CREATE INDEX IF NOT EXISTS recommended_tools_category_idx
  ON public.recommended_tools (category);

CREATE INDEX IF NOT EXISTS recommended_tools_dates_idx
  ON public.recommended_tools (start_date, end_date);

DROP TRIGGER IF EXISTS update_recommended_tools_updated_at ON public.recommended_tools;
CREATE TRIGGER update_recommended_tools_updated_at
  BEFORE UPDATE ON public.recommended_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.recommended_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active recommended tools" ON public.recommended_tools;
CREATE POLICY "Public can view active recommended tools"
  ON public.recommended_tools
  FOR SELECT
  USING (
    is_active = true
    AND (start_date IS NULL OR now() >= start_date)
    AND (end_date IS NULL OR now() <= end_date)
  );

DROP POLICY IF EXISTS "Admins can manage recommended tools" ON public.recommended_tools;
CREATE POLICY "Admins can manage recommended tools"
  ON public.recommended_tools
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Atomic counters for tracking
CREATE OR REPLACE FUNCTION public.increment_recommended_tool_click(tool_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.recommended_tools
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE slug = tool_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_recommended_tool_impression(tool_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.recommended_tools
  SET impression_count = impression_count + 1,
      updated_at = now()
  WHERE slug = tool_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_recommended_tool_click(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_recommended_tool_impression(TEXT) TO anon, authenticated;

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('recommended-tools', 'recommended-tools', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recommended tool logos
DROP POLICY IF EXISTS "Public read recommended tool logos" ON storage.objects;
CREATE POLICY "Public read recommended tool logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recommended-tools');

DROP POLICY IF EXISTS "Admins upload recommended tool logos" ON storage.objects;
CREATE POLICY "Admins upload recommended tool logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recommended-tools'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins update recommended tool logos" ON storage.objects;
CREATE POLICY "Admins update recommended tool logos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'recommended-tools'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'recommended-tools'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins delete recommended tool logos" ON storage.objects;
CREATE POLICY "Admins delete recommended tool logos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recommended-tools'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Seed data
INSERT INTO public.recommended_tools (
  slug,
  name,
  logo_url,
  description,
  category,
  destination_url,
  is_affiliate,
  is_sponsored,
  sponsor_name,
  sponsor_level,
  priority,
  display_order,
  is_active
)
VALUES
  ('cursor', 'Cursor', '/logos/cursor.png', 'AI-powered code editor built for modern teams.', 'Development', 'https://www.cursor.com', true, false, NULL, NULL, 90, 1, true),
  ('claude', 'Claude', '/logos/claude.png', 'Thoughtful AI assistant for writing, research, and analysis.', 'AI', 'https://www.anthropic.com/claude', true, false, NULL, NULL, 85, 2, true),
  ('chatgpt', 'ChatGPT', '/logos/chatgpt.png', 'Versatile AI chat assistant for daily work and ideation.', 'AI', 'https://chat.openai.com', true, false, NULL, NULL, 80, 3, true),
  ('gemini', 'Gemini', '/logos/gemini.png', 'Google AI assistant for productivity and deep research.', 'AI', 'https://gemini.google.com', true, false, NULL, NULL, 78, 4, true),
  ('sider', 'Sider', '/logos/sider.png', 'AI sidebar to summarize, translate, and enhance browsing.', 'Productivity', 'https://sider.ai', true, false, NULL, NULL, 70, 5, true),
  ('monica', 'Monica', '/logos/monica.png', 'AI copilot for writing, searching, and drafting.', 'Productivity', 'https://monica.im', true, false, NULL, NULL, 68, 6, true),
  ('perplexity', 'Perplexity', '/logos/perplexity.png', 'Answer engine for fast, cited research.', 'AI', 'https://www.perplexity.ai', true, false, NULL, NULL, 82, 7, true),
  ('github-copilot', 'GitHub Copilot', '/logos/github-copilot.png', 'AI pair programmer inside your IDE.', 'Development', 'https://github.com/features/copilot', true, false, NULL, NULL, 88, 8, true),
  ('windsurf', 'Windsurf', '/logos/windsurf.png', 'AI coding agent for rapid prototyping.', 'Development', 'https://www.windsurf.ai', true, false, NULL, NULL, 72, 9, true),
  ('railway', 'Railway', '/logos/railway.png', 'Deploy apps fast with instant environments.', 'Deployment', 'https://railway.app', true, false, NULL, NULL, 65, 10, true),
  ('vercel', 'Vercel', '/logos/vercel.png', 'Frontend hosting built for modern frameworks.', 'Hosting', 'https://vercel.com', true, false, NULL, NULL, 75, 11, true),
  ('supabase', 'Supabase', '/logos/supabase.png', 'Open-source Firebase alternative with Postgres.', 'Database', 'https://supabase.com', true, false, NULL, NULL, 74, 12, true),
  ('neon', 'Neon', '/logos/neon.png', 'Serverless Postgres with instant branching.', 'Database', 'https://neon.tech', true, false, NULL, NULL, 66, 13, true),
  ('render', 'Render', '/logos/render.png', 'Unified cloud to host web services and jobs.', 'Hosting', 'https://render.com', true, false, NULL, NULL, 62, 14, true),
  ('figma', 'Figma', '/logos/figma.png', 'Collaborative design and prototyping platform.', 'Design', 'https://www.figma.com', true, false, NULL, NULL, 83, 15, true),
  ('canva', 'Canva', '/logos/canva.png', 'Create marketing assets and presentations quickly.', 'Design', 'https://www.canva.com', true, false, NULL, NULL, 60, 16, true),
  ('framer', 'Framer', '/logos/framer.png', 'Design, prototype, and publish interactive sites.', 'Design', 'https://www.framer.com', true, false, NULL, NULL, 64, 17, true)
ON CONFLICT (slug) DO NOTHING;
