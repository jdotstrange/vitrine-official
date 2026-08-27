-- Wave 4 security: RLS on category/field dictionaries + service-role-only tables.
-- Preview and production share this DB.
--
-- Dictionaries are public catalogs. Clients already have SELECT only.
-- ENABLE RLS + SELECT USING (true) for anon/authenticated so pickers keep
-- working. Writes stay service_role (bypasses RLS). Do NOT FORCE RLS.
--
-- Service-role-only tables have no anon/authenticated grants today.
-- ENABLE RLS with no client policies so a future GRANT cannot leak rows.
-- Skip _prisma_migrations (Prisma internals).

-- ─────────────────────────────────────────────────────────────────────────────
-- Dictionaries (client SELECT)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'fields',
    'field_type_mappings',
    'field_category_mappings',
    'field_subcategory_mappings',
    'category_types',
    'category_categories',
    'category_subcategories',
    'category_type_category_mapping',
    'category_category_subcategory_mapping',
    'category_field_options',
    'category_field_option_visibility',
    'category_field_visibility',
    'category_field_slider_config',
    'view_counters'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'read dictionary', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      'read dictionary',
      t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Service-role-only (no client policies)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectible_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_alert_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_retag_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_collectors_cache ENABLE ROW LEVEL SECURITY;
