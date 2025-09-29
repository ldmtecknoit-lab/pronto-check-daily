import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays, addWeeks } from 'date-fns';

export interface Operator {
  id: string;
  name: string;
  role: 'autista' | 'soccorritore' | 'medico';
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface Shift {
  id: string;
  date: string;
  shift_type: 'giorno' | 'notte';
  autista_id: string;
  soccorritore_id: string;
  autista: Operator;
  soccorritore: Operator;
}

export interface WeeklyShift {
  id: string;
  date: string;
  dayName: string;
  shifts: {
    giorno?: Shift;
    notte?: Shift;
  };
}

const getDayName = (date: Date): string => {
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return days[date.getDay()];
};

export const useOperators = () => {
  return useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Operator[];
    }
  });
};

export const useWeeklyShifts = (weekOffset: number = 0) => {
  return useQuery({
    queryKey: ['weekly-shifts', weekOffset],
    queryFn: async () => {
      // Calcola la settimana corrente + offset
      const today = new Date();
      const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), weekOffset);
      const weekEnd = addDays(weekStart, 6);

      // Fetch shifts per la settimana
      const { data: shiftsData, error } = await supabase
        .from('shifts')
        .select(`
          *,
          autista:autista_id (id, name, role, phone, email, is_active),
          soccorritore:soccorritore_id (id, name, role, phone, email, is_active)
        `)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date');

      if (error) throw error;

      // Organizza i dati per giorno
      const weeklyShifts: WeeklyShift[] = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(weekStart, i);
        const dateString = format(currentDate, 'yyyy-MM-dd');
        const dayName = getDayName(currentDate);

        // Trova turni per questo giorno
        const dayShifts = (shiftsData as any[])?.filter(shift => shift.date === dateString) || [];
        
        const giornoShift = dayShifts.find(s => s.shift_type === 'giorno');
        const notteShift = dayShifts.find(s => s.shift_type === 'notte');

        weeklyShifts.push({
          id: `week-${dateString}`,
          date: dateString,
          dayName,
          shifts: {
            giorno: giornoShift ? {
              ...giornoShift,
              autista: giornoShift.autista,
              soccorritore: giornoShift.soccorritore
            } : undefined,
            notte: notteShift ? {
              ...notteShift,
              autista: notteShift.autista,
              soccorritore: notteShift.soccorritore
            } : undefined
          }
        });
      }

      return weeklyShifts;
    }
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  const updateShift = async (shiftId: string, updates: Partial<Omit<Shift, 'id' | 'autista' | 'soccorritore'>>) => {
    const { error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId);

    if (error) throw error;

    // Invalida le query per aggiornare i dati
    queryClient.invalidateQueries({ queryKey: ['weekly-shifts'] });
  };

  return { updateShift };
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  const createShift = async (shift: Omit<Shift, 'id' | 'autista' | 'soccorritore'>) => {
    const { error } = await supabase
      .from('shifts')
      .insert([shift]);

    if (error) throw error;

    // Invalida le query per aggiornare i dati
    queryClient.invalidateQueries({ queryKey: ['weekly-shifts'] });
  };

  return { createShift };
};