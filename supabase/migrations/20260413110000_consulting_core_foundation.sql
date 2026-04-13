-- CONS-01: Fundacao do CRM de Consultoria MX
-- Cria o contexto isolado de consultoria sem alterar o core operacional existente.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.consulting_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    legal_name text,
    cnpj text,
    product_name text,
    status text NOT NULL DEFAULT 'ativo',
    notes text,
    primary_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_client_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
    name text NOT NULL,
    city text,
    state text,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_client_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    role text,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assignment_role text NOT NULL DEFAULT 'responsavel',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT consulting_assignments_role_check CHECK (assignment_role = ANY (ARRAY['responsavel'::text, 'auxiliar'::text, 'viewer'::text]))
);

CREATE UNIQUE INDEX IF NOT EXISTS consulting_assignments_client_user_unique
    ON public.consulting_assignments (client_id, user_id);
CREATE INDEX IF NOT EXISTS consulting_clients_name_idx
    ON public.consulting_clients (name);
CREATE INDEX IF NOT EXISTS consulting_clients_status_idx
    ON public.consulting_clients (status);
CREATE INDEX IF NOT EXISTS consulting_units_client_idx
    ON public.consulting_client_units (client_id);
CREATE INDEX IF NOT EXISTS consulting_contacts_client_idx
    ON public.consulting_client_contacts (client_id);
CREATE INDEX IF NOT EXISTS consulting_assignments_user_active_idx
    ON public.consulting_assignments (user_id, active);

DROP TRIGGER IF EXISTS update_consulting_clients_updated_at ON public.consulting_clients;
CREATE TRIGGER update_consulting_clients_updated_at
BEFORE UPDATE ON public.consulting_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_client_units_updated_at ON public.consulting_client_units;
CREATE TRIGGER update_consulting_client_units_updated_at
BEFORE UPDATE ON public.consulting_client_units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_client_contacts_updated_at ON public.consulting_client_contacts;
CREATE TRIGGER update_consulting_client_contacts_updated_at
BEFORE UPDATE ON public.consulting_client_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_assignments_updated_at ON public.consulting_assignments;
CREATE TRIGGER update_consulting_assignments_updated_at
BEFORE UPDATE ON public.consulting_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE OR REPLACE FUNCTION public.can_access_consulting_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.consulting_assignments ca
            WHERE ca.client_id = p_client_id
              AND ca.user_id = auth.uid()
              AND ca.active = true
        )
$$;

ALTER TABLE public.consulting_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consulting_clients_select ON public.consulting_clients;
CREATE POLICY consulting_clients_select ON public.consulting_clients
    FOR SELECT TO authenticated
    USING (public.can_access_consulting_client(id));

DROP POLICY IF EXISTS consulting_clients_insert ON public.consulting_clients;
CREATE POLICY consulting_clients_insert ON public.consulting_clients
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_clients_update ON public.consulting_clients;
CREATE POLICY consulting_clients_update ON public.consulting_clients
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_clients_delete ON public.consulting_clients;
CREATE POLICY consulting_clients_delete ON public.consulting_clients
    FOR DELETE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS consulting_client_units_select ON public.consulting_client_units;
CREATE POLICY consulting_client_units_select ON public.consulting_client_units
    FOR SELECT TO authenticated
    USING (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_client_units_write ON public.consulting_client_units;
CREATE POLICY consulting_client_units_write ON public.consulting_client_units
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_client_contacts_select ON public.consulting_client_contacts;
CREATE POLICY consulting_client_contacts_select ON public.consulting_client_contacts
    FOR SELECT TO authenticated
    USING (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_client_contacts_write ON public.consulting_client_contacts;
CREATE POLICY consulting_client_contacts_write ON public.consulting_client_contacts
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_assignments_select ON public.consulting_assignments;
CREATE POLICY consulting_assignments_select ON public.consulting_assignments
    FOR SELECT TO authenticated
    USING (public.is_admin() OR public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_assignments_write ON public.consulting_assignments;
CREATE POLICY consulting_assignments_write ON public.consulting_assignments
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
