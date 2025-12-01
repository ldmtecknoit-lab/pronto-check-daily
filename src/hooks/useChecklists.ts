import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { DailyChecklist, ChecklistItem, ShiftType } from '@/types/ambulance';
import { CHECKLIST_TEMPLATE } from '@/types/ambulance';

// Fetch checklists for a specific date range
export const useChecklists = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['checklists', startDate, endDate],
    queryFn: async () => {
      let checklistQuery = supabase
        .from('checklists')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) checklistQuery = checklistQuery.gte('date', startDate);
      if (endDate) checklistQuery = checklistQuery.lte('date', endDate);

      const { data: checklistRows, error: checklistError } = await checklistQuery;
      if (checklistError) throw checklistError;

      if (!checklistRows || checklistRows.length === 0) {
        return [];
      }

      const ids = checklistRows.map((c: any) => c.id);

      // Fetch all items for these checklists
      const { data: itemRows, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .in('checklist_id', ids)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      // Group items by checklist_id
      const itemsByChecklist: Record<string, any[]> = {};
      (itemRows ?? []).forEach((row: any) => {
        if (!itemsByChecklist[row.checklist_id]) {
          itemsByChecklist[row.checklist_id] = [];
        }
        itemsByChecklist[row.checklist_id].push(row);
      });

      // Transform to DailyChecklist format
      const checklists: DailyChecklist[] = checklistRows.map((item: any) => ({
        id: item.id,
        date: item.date,
        shift: item.shift_type as ShiftType,
        status: item.status,
        completedAt: item.completed_at,
        completedBy: item.completed_by,
        items: (itemsByChecklist[item.id] || []).map((checklistItem: any) => ({
          id: checklistItem.id,
          category: checklistItem.category,
          description: checklistItem.description,
          completed: checklistItem.completed,
          required: checklistItem.required,
          notes: checklistItem.notes || '',
          value: checklistItem.value as 'si' | 'no' | null,
          assignedTo: checklistItem.assigned_to || '',
          signature: checklistItem.signature || '',
        }))
      }));

      return checklists;
    }
  });
};

// Fetch a single checklist by ID with all items
export const useChecklist = (checklistId: string | null) => {
  return useQuery({
    queryKey: ['checklist', checklistId],
    queryFn: async () => {
      if (!checklistId) return null;

      const { data: checklist, error: checklistError } = await supabase
        .from('checklists')
        .select('*')
        .eq('id', checklistId)
        .single();

      if (checklistError) throw checklistError;

      const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        id: checklist.id,
        date: checklist.date,
        shift: checklist.shift_type as ShiftType,
        status: checklist.status,
        completedAt: checklist.completed_at,
        completedBy: checklist.completed_by,
        items: (items || []).map((item: any) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          completed: item.completed,
          required: item.required,
          notes: item.notes || '',
          value: item.value as 'si' | 'no' | null,
          assignedTo: item.assigned_to || '',
          signature: item.signature || '',
        }))
      } as DailyChecklist;
    },
    enabled: !!checklistId
  });
};

// Fetch checklist for today
export const useTodayChecklists = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useChecklists(today, today);
};

// Create a new checklist
export const useCreateChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shift, date }: { shift: ShiftType; date: string }) => {
      // Create checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          date,
          shift_type: shift,
          status: 'pending'
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Create checklist items from template
      const items = CHECKLIST_TEMPLATE.map(template => ({
        checklist_id: checklistData.id,
        category: template.category,
        description: template.description,
        completed: false,
        required: template.required,
        notes: '',
        value: null,
        assigned_to: ''
      }));

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(items);

      if (itemsError) throw itemsError;

      return checklistData.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    }
  });
};

// Update checklist
export const useUpdateChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checklist: DailyChecklist) => {
      // Update checklist header
      const checklistUpdate: any = {
        status: checklist.status,
        updated_at: new Date().toISOString()
      };

      if (checklist.status === 'completed' && checklist.completedBy) {
        checklistUpdate.completed_at = new Date().toISOString();
        checklistUpdate.completed_by = checklist.completedBy;
      }

      const { error: checklistError } = await supabase
        .from('checklists')
        .update(checklistUpdate)
        .eq('id', checklist.id);

      if (checklistError) {
        console.error('Error updating checklist:', checklistError);
        throw checklistError;
      }

      // Update all checklist items in batch
      if (checklist.items && checklist.items.length > 0) {
        const updatePromises = checklist.items.map(item => 
          supabase
            .from('checklist_items')
            .update({
              completed: item.completed,
              notes: item.notes || '',
              value: item.value,
              assigned_to: item.assignedTo || '',
              signature: item.signature || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
        );

        const results = await Promise.all(updatePromises);
        
        // Check for errors
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          console.error('Errors updating items:', errors);
          throw new Error(`Failed to update ${errors.length} items`);
        }
      }

      return checklist;
    },
    onSuccess: () => {
      // Invalida tutte le query relative alle checklist per forzare il refetch
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    }
  });
};

// Get or create checklist for a specific shift and date
export const useGetOrCreateChecklist = () => {
  const createChecklist = useCreateChecklist();
  const queryClient = useQueryClient();

  const getOrCreateChecklist = async (shift: ShiftType, date: string = format(new Date(), 'yyyy-MM-dd')): Promise<string> => {
    // Check if checklist already exists
    const { data: existingChecklists } = await supabase
      .from('checklists')
      .select('id')
      .eq('date', date)
      .eq('shift_type', shift);

    if (existingChecklists && existingChecklists.length > 0) {
      return existingChecklists[0].id;
    }

    // Create new checklist
    const checklistId = await createChecklist.mutateAsync({ shift, date });
    
    // Invalidate queries to refetch
    queryClient.invalidateQueries({ queryKey: ['checklists'] });
    queryClient.invalidateQueries({ queryKey: ['checklist'] });

    return checklistId;
  };

  return { getOrCreateChecklist, isCreating: createChecklist.isPending };
};