-- Drop the specific policy that's causing the conflict
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent lire les statistiques de correcti" ON public.agency_correction_stats;

-- Also try with a truncated name (in case the name was truncated in the error message)
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent lire les statistiques de correc" ON public.agency_correction_stats;
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent lire les statistiques de corre" ON public.agency_correction_stats;
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent lire les statistiques de corr" ON public.agency_correction_stats;

-- Drop all policies on this table to be safe
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'agency_correction_stats' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.agency_correction_stats', policy_name);
    END LOOP;
END
$$;

-- Now you can create your new policy
CREATE POLICY "agency_correction_stats_select_policy" 
ON public.agency_correction_stats
FOR SELECT 
TO public
USING (true);