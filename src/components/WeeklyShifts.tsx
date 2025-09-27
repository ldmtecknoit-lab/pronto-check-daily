import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  Car, 
  Heart, 
  Phone, 
  Mail,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { useState } from 'react';
import { generateWeeklyShifts, type WeeklyShift, type Operator } from '@/types/shifts';

interface WeeklyShiftsProps {
  onBack?: () => void;
}

export default function WeeklyShifts({ onBack }: WeeklyShiftsProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [weeklyShifts] = useState<WeeklyShift[]>(() => generateWeeklyShifts());

  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      end: endOfWeek.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };
  };

  const getRoleIcon = (role: Operator['role']) => {
    switch (role) {
      case 'autista': return <Car className="h-4 w-4" />;
      case 'soccorritore': return <Heart className="h-4 w-4" />;
      case 'medico': return <Heart className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: Operator['role']) => {
    switch (role) {
      case 'autista': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'soccorritore': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medico': return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const { start, end } = getWeekRange();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Turni Settimanali Operatori
              </h1>
              <p className="text-primary-foreground/90">
                Gestione e visualizzazione turni ambulanza
              </p>
            </div>
            {onBack && (
              <Button 
                onClick={onBack}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Torna alla Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Settimana precedente
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold flex items-center gap-2 justify-center">
                <Calendar className="h-5 w-5" />
                {start} - {end}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentWeekOffset === 0 ? 'Settimana corrente' : 
                 currentWeekOffset > 0 ? `+${currentWeekOffset} settimane` : 
                 `${currentWeekOffset} settimane`}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              className="gap-2"
            >
              Settimana successiva
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule Grid */}
      <div className="grid gap-4">
        {weeklyShifts.map((dayShift) => (
          <Card 
            key={dayShift.id} 
            className={`transition-all duration-200 ${
              isToday(dayShift.date) 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {dayShift.dayName}
                  {isToday(dayShift.date) && (
                    <Badge className="bg-primary text-primary-foreground">Oggi</Badge>
                  )}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {new Date(dayShift.date).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Turno Giorno */}
              <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  ☀️ Turno Giorno (08:00 - 20:00)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(dayShift.shifts.giorno.autista.role)}
                      <span className="font-medium">{dayShift.shifts.giorno.autista.name}</span>
                      <Badge className={getRoleBadgeVariant(dayShift.shifts.giorno.autista.role)}>
                        Autista
                      </Badge>
                    </div>
                    {dayShift.shifts.giorno.autista.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {dayShift.shifts.giorno.autista.phone}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(dayShift.shifts.giorno.soccorritore.role)}
                      <span className="font-medium">{dayShift.shifts.giorno.soccorritore.name}</span>
                      <Badge className={getRoleBadgeVariant(dayShift.shifts.giorno.soccorritore.role)}>
                        Soccorritore
                      </Badge>
                    </div>
                    {dayShift.shifts.giorno.soccorritore.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {dayShift.shifts.giorno.soccorritore.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Turno Notte */}
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  🌙 Turno Notte (20:00 - 08:00)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(dayShift.shifts.notte.autista.role)}
                      <span className="font-medium">{dayShift.shifts.notte.autista.name}</span>
                      <Badge className={getRoleBadgeVariant(dayShift.shifts.notte.autista.role)}>
                        Autista
                      </Badge>
                    </div>
                    {dayShift.shifts.notte.autista.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {dayShift.shifts.notte.autista.phone}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(dayShift.shifts.notte.soccorritore.role)}
                      <span className="font-medium">{dayShift.shifts.notte.soccorritore.name}</span>
                      <Badge className={getRoleBadgeVariant(dayShift.shifts.notte.soccorritore.role)}>
                        Soccorritore
                      </Badge>
                    </div>
                    {dayShift.shifts.notte.soccorritore.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {dayShift.shifts.notte.soccorritore.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">14</p>
            <p className="text-sm text-muted-foreground">Operatori totali</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">7</p>
            <p className="text-sm text-muted-foreground">Autisti</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">7</p>
            <p className="text-sm text-muted-foreground">Soccorritori</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}