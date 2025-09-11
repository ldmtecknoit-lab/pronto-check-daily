import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, User, FileText } from 'lucide-react';
import type { DailyChecklist } from '@/types/ambulance';

interface HistoryViewProps {
  history: DailyChecklist[];
  onBack: () => void;
  onViewChecklist: (checklist: DailyChecklist) => void;
}

const SHIFT_LABELS = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  sera: 'Sera'
};

export default function HistoryView({ history, onBack, onViewChecklist }: HistoryViewProps) {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getStatusBadge = (status: DailyChecklist['status']) => {
    switch (status) {
      case 'completed': 
        return <Badge className="bg-success text-success-foreground">Completato</Badge>;
      case 'partial': 
        return <Badge className="bg-warning text-warning-foreground">Parziale</Badge>;
      case 'pending': 
        return <Badge variant="outline">In attesa</Badge>;
      default: 
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  const getCompletionStats = (checklist: DailyChecklist) => {
    const completed = checklist.items.filter(item => item.completed).length;
    const total = checklist.items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alla Dashboard
          </Button>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuno storico disponibile</h3>
            <p className="text-muted-foreground">
              Completa la prima checklist per vedere lo storico qui.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Torna alla Dashboard
        </Button>
        <div className="text-right">
          <div className="text-sm font-medium">
            {history.length} checklist nello storico
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Storico Checklist Ambulanza
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {sortedHistory.map((checklist) => {
          const { completed, total, percentage } = getCompletionStats(checklist);
          
          return (
            <Card key={checklist.id} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {SHIFT_LABELS[checklist.shift]}
                      </h3>
                      {getStatusBadge(checklist.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(checklist.date).toLocaleDateString('it-IT')}
                      </div>
                      
                      {checklist.completedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(checklist.completedAt).toLocaleTimeString('it-IT')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewChecklist(checklist)}
                  >
                    Visualizza
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso checklist</span>
                    <span className="font-medium">{percentage}% ({completed}/{total})</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        checklist.status === 'completed' 
                          ? 'bg-success' 
                          : checklist.status === 'partial' 
                          ? 'bg-warning' 
                          : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {checklist.completedBy && (
                  <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Completato da: {checklist.completedBy}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}