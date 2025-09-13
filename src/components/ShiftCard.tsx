import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import type { ShiftType, DailyChecklist } from '@/types/ambulance';

interface ShiftCardProps {
  shift: ShiftType;
  checklist?: DailyChecklist;
  onStartChecklist: () => void;
}

const SHIFT_LABELS = {
  giorno: 'Turno Giorno',
  notte: 'Turno Notte'
};

const SHIFT_TIMES = {
  giorno: '08:00 - 20:00',
  notte: '20:00 - 08:00'
};

export default function ShiftCard({ shift, checklist, onStartChecklist }: ShiftCardProps) {
  const getStatusColor = () => {
    if (!checklist) return 'border-muted';
    switch (checklist.status) {
      case 'completed': return 'border-success bg-success/5';
      case 'partial': return 'border-warning bg-warning/5';
      case 'pending': return 'border-muted';
      default: return 'border-muted';
    }
  };

  const getStatusIcon = () => {
    if (!checklist) return <Clock className="h-5 w-5 text-muted-foreground" />;
    switch (checklist.status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'partial': return <AlertTriangle className="h-5 w-5 text-warning" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    if (!checklist) return <Badge variant="outline">Non iniziato</Badge>;
    switch (checklist.status) {
      case 'completed': return <Badge className="bg-success text-success-foreground">Completato</Badge>;
      case 'partial': return <Badge className="bg-warning text-warning-foreground">In corso</Badge>;
      case 'pending': return <Badge variant="outline">In attesa</Badge>;
      default: return <Badge variant="outline">Non iniziato</Badge>;
    }
  };

  const getCompletedCount = () => {
    if (!checklist) return { completed: 0, total: 0 };
    const completed = checklist.items.filter(item => item.completed).length;
    const total = checklist.items.length;
    return { completed, total };
  };

  const { completed, total } = getCompletedCount();

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon()}
            {SHIFT_LABELS[shift]}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground font-medium">{SHIFT_TIMES[shift]}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklist && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso checklist:</span>
            <span className="font-medium">
              {completed}/{total}
            </span>
          </div>
        )}
        
        {checklist && checklist.status === 'completed' && checklist.completedAt && (
          <p className="text-xs text-success font-medium">
            Completato: {new Date(checklist.completedAt).toLocaleString('it-IT')}
          </p>
        )}

        <Button 
          onClick={onStartChecklist}
          className="w-full"
          variant={checklist?.status === 'completed' ? 'outline' : 'default'}
        >
          <Play className="h-4 w-4 mr-2" />
          {checklist?.status === 'completed' ? 'Rivedi' : checklist ? 'Continua' : 'Inizia'} Checklist
        </Button>
      </CardContent>
    </Card>
  );
}