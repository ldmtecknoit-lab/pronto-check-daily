import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppVersion {
  id: string;
  version: string;
  apk_url: string;
  release_notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export const useCurrentAppVersion = () => {
  return useQuery({
    queryKey: ['app-version', 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error) throw error;
      return data as AppVersion;
    },
  });
};
