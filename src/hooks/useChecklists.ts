import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { z } from 'zod';
import type { DailyChecklist, ChecklistItem, ShiftType } from '@/types/ambulance';
import { CHECKLIST_TEMPLATE } from '@/types/ambulance';

// Validation schemas
const checklistItemSchema = z.object({
  id: z.string().optional(),
  category: z.string().trim().min(1, "Categoria richiesta").max(100, "Categoria troppo lunga"),
  description: z.string().trim().min(1, "Descrizione richiesta").max(255, "Descrizione troppo lunga"),
  completed: z.boolean(),
  required: z.boolean(),
  notes: z.string().trim().max(500, "Note troppo lunghe").optional(),
  value: z.enum(['si', 'no']).nullable().optional(),
  assigned_to: z.string().trim().max(100, "Nome assegnato troppo lungo").optional()
});

const checklistSchema = z.object({
  date: z.string().min(1, "Data richiesta"),
  shift_type: z.enum(['giorno', 'notte']),
  status: z.enum(['pending', 'completed', 'partial']),
  completed_by: z.string().trim().max(100, "Nome completamento troppo lungo").optional(),
  items: z.array(checklistItemSchema)
});

// Fetch checklists for a specific date range
export const useChecklists = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['checklists', startDate, endDate],
    queryFn: async () => {
      // Fetch checklists first (no nested select to avoid FK dependency)
      let checklistQuery = supabase
        .from('checklists')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) checklistQuery = checklistQuery.gte('date', startDate);
      if (endDate) checklistQuery = checklistQuery.lte('date', endDate);

      const { data: checklistRows, error: checklistError } = await checklistQuery;
      if (checklistError) throw checklistError;

      const ids = (checklistRows ?? []).map((c: any) => c.id);

      // Fetch all items for these checklists in one query
      let itemsByChecklist: Record<string, any[]> = {};
      if (ids.length > 0) {
        const { data: itemRows, error: itemsError } = await supabase
          .from('checklist_items')
          .select('*')
          .in('checklist_id', ids)
          .order('created_at', { ascending: true });
        if (itemsError) throw itemsError;

        itemsByChecklist = (itemRows ?? []).reduce((acc: Record<string, any[]>, row: any) => {
          acc[row.checklist_id] = acc[row.checklist_id] || [];
          acc[row.checklist_id].push(row);
          return acc;
        }, {});
      }

      // Transform data to DailyChecklist
      const checklists: DailyChecklist[] = (checklistRows as any[])?.map(item => ({
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
          notes: checklistItem.notes ?? undefined,
          value: (checklistItem.value as 'si' | 'no' | null) ?? null,
          assignedTo: checklistItem.assigned_to ?? undefined,
        }))
      })) || [];

      return checklists;
    }
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
      // Validate input
      const validatedData = checklistSchema.parse({
        date,
        shift_type: shift,
        status: 'pending' as const,
        items: CHECKLIST_TEMPLATE.map(template => ({
          ...template,
          completed: false,
          value: null
        }))
      });

      // Create checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists')
        .insert([{
          date: validatedData.date,
          shift_type: validatedData.shift_type,
          status: validatedData.status
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Create checklist items
      const items = validatedData.items.map(item => ({
        checklist_id: checklistData.id,
        category: item.category,
        description: item.description,
        completed: item.completed,
        required: item.required,
        notes: item.notes,
        value: item.value,
        assigned_to: item.assigned_to
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
      // Validate checklist data (but preserve existing IDs for items)
      const validatedItems = checklist.items.map(item => ({
        ...checklistItemSchema.parse(item),
        id: item.id // Preserve the original ID
      }));

      // Update checklist
      const checklistUpdate: any = {
        status: checklist.status,
        updated_at: new Date().toISOString()
      };

      if (checklist.status === 'completed') {
        checklistUpdate.completed_at = new Date().toISOString();
        checklistUpdate.completed_by = checklist.completedBy;
      }

      const { error: checklistError } = await supabase
        .from('checklists')
        .update(checklistUpdate)
        .eq('id', checklist.id);

      if (checklistError) throw checklistError;

      // Update checklist items with fallback when ID is temporary
      for (const item of validatedItems) {
        const updatePayload = {
          completed: item.completed,
          notes: item.notes,
          value: item.value,
          assigned_to: item.assigned_to,
          updated_at: new Date().toISOString()
        } as const;

        const isUuid = typeof item.id === 'string' && /^[0-9a-fA-F-]{36}$/.test(item.id);

        let itemError;
        if (isUuid) {
          const { error } = await supabase
            .from('checklist_items')
            .update(updatePayload)
            .eq('id', item.id);
          itemError = error;
        } else {
          const { error } = await supabase
            .from('checklist_items')
            .update(updatePayload)
            .eq('checklist_id', checklist.id)
            .eq('category', item.category)
            .eq('description', item.description);
          itemError = error;
        }

        if (itemError) throw itemError;
      }

      return checklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    }
  });
};

// Get or create checklist for a specific shift and date
export const useGetOrCreateChecklist = () => {
  const createChecklist = useCreateChecklist();
  const { data: checklists } = useTodayChecklists();

  const getOrCreateChecklist = async (shift: ShiftType, date: string = format(new Date(), 'yyyy-MM-dd')): Promise<DailyChecklist> => {
    // Check if checklist already exists
    const existingChecklist = checklists?.find(cl => cl.shift === shift && cl.date === date);
    
    if (existingChecklist) {
      return existingChecklist;
    }

  // Create new checklist
  const checklistId = await createChecklist.mutateAsync({ shift, date });
  
  // Fetch the real items for this checklist so we have correct IDs
  const { data: dbItems, error: fetchItemsError } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('checklist_id', checklistId)
    .order('created_at', { ascending: true });

  if (fetchItemsError) throw fetchItemsError;

  const items: ChecklistItem[] = (dbItems ?? []).map((row: any) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    completed: row.completed,
    required: row.required,
    notes: row.notes ?? undefined,
    value: (row.value as 'si' | 'no' | null) ?? null,
    assignedTo: row.assigned_to ?? undefined,
  }));

  return {
    id: checklistId,
    date,
    shift,
    items,
    status: 'pending'
  };
  };

  return { getOrCreateChecklist, isCreating: createChecklist.isPending };
};