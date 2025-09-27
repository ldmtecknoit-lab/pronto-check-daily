import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Communication {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: number;
  created_at: string;
  expires_at?: string;
}

export const useCommunications = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        const { data, error } = await supabase
          .from('communications')
          .select('*')
          .eq('is_active', true)
          .or('expires_at.is.null,expires_at.gt.now()')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching communications:', error);
          return;
        }

        setCommunications((data || []) as Communication[]);
      } catch (error) {
        console.error('Error fetching communications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();

    // Set up real-time subscription for new communications
    const channel = supabase
      .channel('communications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications'
        },
        () => {
          fetchCommunications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { communications, loading };
};