import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SignaturePad from './SignaturePad';
import type { ShiftAssignment } from '@/types/ambulance';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface ShiftAssignmentFormProps {
  shiftAssignment: ShiftAssignment;
  onUpdate: (assignment: ShiftAssignment) => void;
  isCompleted: boolean;
}

export default function ShiftAssignmentForm({
  shiftAssignment,
  onUpdate,
  isCompleted,
}: ShiftAssignmentFormProps) {
  const isDriverSigned = !!(shiftAssignment.driverName && shiftAssignment.driverSignature);
  const isRescuerSigned = !!(shiftAssignment.rescuerName && shiftAssignment.rescuerSignature);
  const isShiftComplete = isDriverSigned && isRescuerSigned;

  const updateField = <K extends keyof ShiftAssignment>(key: K, value: ShiftAssignment[K]) => {
    if (isCompleted) return;
    onUpdate({
      ...shiftAssignment,
      [key]: value,
    });
  };

  return (
    <Card className={isShiftComplete ? 'border-green-500' : 'border-red-500'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Assegnazione Turno</span>
          <Badge className={isShiftComplete ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
            {isShiftComplete ? 'COMPLETA' : 'MANCANTE'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Blocco Autista */}
        <div className="space-y-4 border p-4 rounded-lg">
          <div className="flex items-center gap-2">
             <h3 className="text-lg font-semibold">Autista</h3>
             {isDriverSigned ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
             ) : (
                <XCircle className="h-5 w-5 text-red-500" />
             )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="driver-name">Nome Autista</Label>
            <Input
              id="driver-name"
              placeholder="Inserisci nome Autista"
              value={shiftAssignment.driverName}
              onChange={(e) => updateField('driverName', e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div className="space-y-2">
            <Label>Firma Autista</Label>
            <SignaturePad
              value={shiftAssignment.driverSignature}
              onChange={(signature) => updateField('driverSignature', signature)}
              disabled={isCompleted}
            />
          </div>
        </div>

        {/* Blocco Soccorritore */}
        <div className="space-y-4 border p-4 rounded-lg">
          <div className="flex items-center gap-2">
             <h3 className="text-lg font-semibold">Soccorritore</h3>
             {isRescuerSigned ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
             ) : (
                <XCircle className="h-5 w-5 text-red-500" />
             )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rescuer-name">Nome Soccorritore</Label>
            <Input
              id="rescuer-name"
              placeholder="Inserisci nome Soccorritore"
              value={shiftAssignment.rescuerName}
              onChange={(e) => updateField('rescuerName', e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div className="space-y-2">
            <Label>Firma Soccorritore</Label>
            <SignaturePad
              value={shiftAssignment.rescuerSignature}
              onChange={(signature) => updateField('rescuerSignature', signature)}
              disabled={isCompleted}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
