import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { History, Ambulance, Calendar, Users, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ShiftCard from '@/components/ShiftCard';
import ChecklistView from '@/components/ChecklistView';
import HistoryView from '@/components/HistoryView';
import WeeklyShifts from '@/components/WeeklyShifts';
import { CommunicationsPanel } from '@/components/CommunicationsPanel';
import { useTodayChecklists, useGetOrCreateChecklist, useUpdateChecklist, useChecklists, useChecklist } from '@/hooks/useChecklists';
import { useMonthlyShiftImage } from '@/hooks/useMonthlyImage';
import ambulanceImage from '@/assets/ambulance.jpg';
import type { DailyChecklist, ShiftType } from '@/types/ambulance';

type ViewMode = 'dashboard' | 'checklist' | 'history' | 'shifts';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [showMonthlyImageDialog, setShowMonthlyImageDialog] = useState(false);
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);
  const { data: todayChecklists } = useTodayChecklists();
  const { data: allChecklists } = useChecklists();
  const { data: currentChecklist } = useChecklist(selectedChecklistId);
  const { getOrCreateChecklist, isCreating } = useGetOrCreateChecklist();
  const updateChecklist = useUpdateChecklist();
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const { data: monthlyImage } = useMonthlyShiftImage(currentMonth, currentYear);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  
  const getCurrentShift = (): ShiftType => {
    if (currentHour >= 8 && currentHour < 20) return 'giorno';
    return 'notte';
  };

  const getChecklistForShift = (shift: ShiftType, date: string = today): DailyChecklist | undefined => {
    return todayChecklists?.find(cl => cl.shift === shift && cl.date === date);
  };

  const handleStartChecklist = async (shift: ShiftType) => {
    try {
      const checklistId = await getOrCreateChecklist(shift);
      setSelectedChecklistId(checklistId);
      setCurrentView('checklist');
    } catch (error) {
      console.error('Error creating/getting checklist:', error);
    }
  };

  const handleSaveChecklist = async (updatedChecklist: DailyChecklist) => {
    await updateChecklist.mutateAsync(updatedChecklist);
  };

  const handleViewFromHistory = (checklist: DailyChecklist) => {
    setSelectedChecklistId(checklist.id);
    setCurrentView('checklist');
  };

  // Get today's checklists
  const todaysChecklists = {
    giorno: getChecklistForShift('giorno'),
    notte: getChecklistForShift('notte')
  };

  const currentShift = getCurrentShift();
  const completedToday = Object.values(todaysChecklists).filter(cl => cl?.status === 'completed').length;

  if (currentView === 'checklist' && currentChecklist) {
    return (
      <ChecklistView
        checklist={currentChecklist}
        onSave={handleSaveChecklist}
        onBack={() => {
          setSelectedChecklistId(null);
          setCurrentView('dashboard');
        }}
        isSaving={updateChecklist.isPending}
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
    <div className="space-y-6" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
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

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentView('shifts')}
          className="gap-2 flex-1 min-w-[200px]"
        >
          <Calendar className="h-4 w-4" />
          Turni Settimanali
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowMonthlyImageDialog(true)}
          className="gap-2 flex-1 min-w-[200px]"
        >
          <ImageIcon className="h-4 w-4" />
          Turni Mensili
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentView('history')}
          className="gap-2 flex-1 min-w-[200px]"
        >
          <History className="h-4 w-4" />
          Visualizza Storico
        </Button>
      </div>

      {/* Shifts Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Checklist per Turno</h2>

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

      {/* Monthly Image Dialog */}
      <Dialog open={showMonthlyImageDialog} onOpenChange={setShowMonthlyImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Turni Mensili - {new Date(currentYear, currentMonth - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          {monthlyImage?.image_url ? (
            <div className="flex justify-center">
              <img 
                src={monthlyImage.image_url} 
                alt="Turni Mensili" 
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowEnlargedImage(true)}
                title="Clicca per ingrandire"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nessuna immagine disponibile per questo mese.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enlarged Image Dialog */}
      <Dialog open={showEnlargedImage} onOpenChange={setShowEnlargedImage}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Immagine Turni Ingrandita</DialogTitle>
          </DialogHeader>
          {monthlyImage?.image_url && (
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit
              wheel={{ step: 0.1 }}
              pinch={{ step: 5 }}
              doubleClick={{ mode: "reset" }}
            >
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                <img 
                  src={monthlyImage.image_url} 
                  alt="Turni Mensili Ingranditi" 
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </TransformComponent>
            </TransformWrapper>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}