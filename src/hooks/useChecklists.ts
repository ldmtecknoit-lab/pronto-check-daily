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
      let query = supabase
        .from('checklists')
        .select(`
          *,
          checklist_items (*)
        `)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match the existing DailyChecklist interface
      const checklists: DailyChecklist[] = (data as any[])?.map(item => ({
        id: item.id,
        date: item.date,
        shift: item.shift_type as ShiftType,
        status: item.status,
        completedAt: item.completed_at,
        completedBy: item.completed_by,
        items: item.checklist_items.map((checklistItem: any) => ({
          id: checklistItem.id,
          category: checklistItem.category,
          description: checklistItem.description,
          completed: checklistItem.completed,
          required: checklistItem.required,
          notes: checklistItem.notes,
          value: checklistItem.value as 'si' | 'no' | null,
          assignedTo: checklistItem.assigned_to
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

      // Update checklist items
      for (const item of validatedItems) {
        const { error: itemError } = await supabase
          .from('checklist_items')
          .update({
            completed: item.completed,
            notes: item.notes,
            value: item.value,
            assigned_to: item.assigned_to,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

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
    
    // Return the newly created checklist
    const newItems: ChecklistItem[] = CHECKLIST_TEMPLATE.map((template, index) => ({
      id: `${shift}-${date}-${index}`, // Temporary ID until we get the real ones
      ...template,
      completed: false,
      value: null
    }));

    return {
      id: checklistId,
      date,
      shift,
      items: newItems,
      status: 'pending'
    };
  };

  return { getOrCreateChecklist, isCreating: createChecklist.isPending };
};