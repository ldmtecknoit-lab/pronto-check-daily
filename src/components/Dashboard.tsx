import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, Ambulance, Calendar, Users } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ShiftCard from '@/components/ShiftCard';
import ChecklistView from '@/components/ChecklistView';
import HistoryView from '@/components/HistoryView';
import WeeklyShifts from '@/components/WeeklyShifts';
import { CommunicationsPanel } from '@/components/CommunicationsPanel';
import { useTodayChecklists, useGetOrCreateChecklist, useUpdateChecklist, useChecklists } from '@/hooks/useChecklists';
import ambulanceImage from '@/assets/ambulance.jpg';
import type { DailyChecklist, ShiftType } from '@/types/ambulance';

type ViewMode = 'dashboard' | 'checklist' | 'history' | 'shifts';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist | null>(null);
  const { data: todayChecklists, isLoading } = useTodayChecklists();
  const { data: allChecklists } = useChecklists();
  const { getOrCreateChecklist, isCreating } = useGetOrCreateChecklist();
  const updateChecklist = useUpdateChecklist();

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  
  // Determine current shift based on time
  const getCurrentShift = (): ShiftType => {
    if (currentHour >= 8 && currentHour < 20) return 'giorno';
    return 'notte';
  };

  // Get checklist for specific shift and date
  const getChecklistForShift = (shift: ShiftType, date: string = today): DailyChecklist | undefined => {
    return todayChecklists?.find(cl => cl.shift === shift && cl.date === date);
  };

  // Handle starting/continuing a checklist
  const handleStartChecklist = async (shift: ShiftType) => {
    try {
      const checklist = await getOrCreateChecklist(shift);
      setSelectedChecklist(checklist);
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error creating/getting checklist:', error);
    }
  };

  // Handle updating checklist
  const handleUpdateChecklist = async (updatedChecklist: DailyChecklist) => {
    try {
      await updateChecklist.mutateAsync(updatedChecklist);
      setSelectedChecklist(updatedChecklist);
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  // Handle viewing checklist from history
  const handleViewFromHistory = async (checklist: DailyChecklist) => {
    // Force refresh the checklist data to ensure items are loaded
    try {
      const { data: freshData } = await supabase
        .from('checklists')
        .select(`
          *,
          checklist_items (*)
        `)
        .eq('id', checklist.id)
        .single();

      if (freshData) {
        const freshChecklist: DailyChecklist = {
          id: freshData.id,
          date: freshData.date,
          shift: freshData.shift_type as ShiftType,
          status: freshData.status as 'completed' | 'partial' | 'pending',
          completedAt: freshData.completed_at,
          completedBy: freshData.completed_by,
          items: freshData.checklist_items.map((item: any) => ({
            id: item.id,
            category: item.category,
            description: item.description,
            completed: item.completed,
            required: item.required,
            notes: item.notes,
            value: item.value as 'si' | 'no' | null,
            assignedTo: item.assigned_to
          }))
        };
        setSelectedChecklist(freshChecklist);
      } else {
        setSelectedChecklist(checklist);
      }
    } catch (error) {
      console.error('Error fetching fresh checklist data:', error);
      setSelectedChecklist(checklist);
    }
    setCurrentView('checklist');
  };

  // Get today's checklists
  const todaysChecklists = {
    giorno: getChecklistForShift('giorno'),
    notte: getChecklistForShift('notte')
  };

  const currentShift = getCurrentShift();
  const completedToday = Object.values(todaysChecklists).filter(cl => cl?.status === 'completed').length;

  if (currentView === 'checklist' && selectedChecklist) {
    return (
      <ChecklistView
        checklist={selectedChecklist}
        onUpdate={handleUpdateChecklist}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'history') {
    return (
      <HistoryView
        history={allChecklists || []}
        onBack={() => setCurrentView('dashboard')}
        onViewChecklist={handleViewFromHistory}
      />
    );
  }

  if (currentView === 'shifts') {
    return (
      <WeeklyShifts onBack={() => setCurrentView('dashboard')} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Communications Panel */}
      <CommunicationsPanel />

      {/* Header */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Checklist Ambulanza 118
              </h1>
              <p className="text-primary-foreground/90">
                Controlli di sicurezza per servizio di emergenza
              </p>
            </div>
            <div className="hidden md:block">
              <img 
                src={ambulanceImage} 
                alt="Ambulanza 118"
                className="w-24 h-24 object-cover rounded-lg border-2 border-white/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data odierna</p>
                <p className="font-semibold">{new Date(today).toLocaleDateString('it-IT')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Ambulance className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turno attuale</p>
                <p className="font-semibold capitalize">{currentShift}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati oggi</p>
                <p className="font-semibold">{completedToday}/2 turni</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Checklist per Turno</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('shifts')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Turni Settimanali
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('history')}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Visualizza Storico
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShiftCard
            shift="giorno"
            checklist={todaysChecklists.giorno}
            onStartChecklist={() => handleStartChecklist('giorno')}
            isLoading={isCreating}
          />
          <ShiftCard
            shift="notte"
            checklist={todaysChecklists.notte}
            onStartChecklist={() => handleStartChecklist('notte')}
            isLoading={isCreating}
          />
        </div>
      </div>

      {/* Current Shift Highlight */}
      {!todaysChecklists[currentShift] && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="p-6 text-center">
            <Ambulance className="h-12 w-12 mx-auto text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              È ora di iniziare il turno {currentShift}!
            </h3>
            <p className="text-muted-foreground mb-4">
              Inizia i controlli di sicurezza per garantire la massima efficienza operativa.
            </p>
            <Button 
              onClick={() => handleStartChecklist(currentShift)}
              className="gap-2"
              disabled={isCreating}
            >
              <Ambulance className="h-4 w-4" />
              {isCreating ? 'Creazione...' : `Inizia Checklist ${currentShift}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}