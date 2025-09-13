import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, Ambulance, Calendar } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ShiftCard from '@/components/ShiftCard';
import ChecklistView from '@/components/ChecklistView';
import HistoryView from '@/components/HistoryView';
import ambulanceImage from '@/assets/ambulance.jpg';
import type { DailyChecklist, ChecklistHistory, ShiftType, ChecklistItem } from '@/types/ambulance';
import { CHECKLIST_TEMPLATE } from '@/types/ambulance';

type ViewMode = 'dashboard' | 'checklist' | 'history';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist | null>(null);
  const [history, setHistory] = useLocalStorage<ChecklistHistory>('ambulance-checklist-history', { checklists: [] });

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  
  // Determine current shift based on time
  const getCurrentShift = (): ShiftType => {
    if (currentHour >= 8 && currentHour < 20) return 'giorno';
    return 'notte';
  };

  // Get checklist for specific shift and date
  const getChecklistForShift = (shift: ShiftType, date: string = today): DailyChecklist | undefined => {
    return history.checklists.find(cl => cl.shift === shift && cl.date === date);
  };

  // Create new checklist for shift
  const createChecklistForShift = (shift: ShiftType): DailyChecklist => {
    const items: ChecklistItem[] = CHECKLIST_TEMPLATE.map((template, index) => ({
      id: `${shift}-${today}-${index}`,
      ...template,
      completed: false
    }));

    return {
      id: `${shift}-${today}`,
      date: today,
      shift,
      items,
      status: 'pending'
    };
  };

  // Handle starting/continuing a checklist
  const handleStartChecklist = (shift: ShiftType) => {
    let checklist = getChecklistForShift(shift);
    
    if (!checklist) {
      checklist = createChecklistForShift(shift);
      setHistory(prev => ({
        checklists: [...prev.checklists, checklist]
      }));
    }
    
    setSelectedChecklist(checklist);
    setCurrentView('checklist');
  };

  // Handle updating checklist
  const handleUpdateChecklist = (updatedChecklist: DailyChecklist) => {
    setHistory(prev => ({
      checklists: prev.checklists.map(cl => 
        cl.id === updatedChecklist.id ? updatedChecklist : cl
      )
    }));
    setSelectedChecklist(updatedChecklist);
  };

  // Handle viewing checklist from history
  const handleViewFromHistory = (checklist: DailyChecklist) => {
    setSelectedChecklist(checklist);
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
        history={history.checklists}
        onBack={() => setCurrentView('dashboard')}
        onViewChecklist={handleViewFromHistory}
      />
    );
  }

  return (
    <div className="space-y-6">
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
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('history')}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Visualizza Storico
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShiftCard
            shift="giorno"
            checklist={todaysChecklists.giorno}
            onStartChecklist={() => handleStartChecklist('giorno')}
          />
          <ShiftCard
            shift="notte"
            checklist={todaysChecklists.notte}
            onStartChecklist={() => handleStartChecklist('notte')}
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
            >
              <Ambulance className="h-4 w-4" />
              Inizia Checklist {currentShift}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}