import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMonthlyShiftImage = (month: number, year: number) => {
  return useQuery({
    queryKey: ['monthly-shift-image', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_shift_images')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};
