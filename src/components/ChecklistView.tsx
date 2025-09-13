import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { DailyChecklist, ChecklistItem } from '@/types/ambulance';

interface ChecklistViewProps {
  checklist: DailyChecklist;
  onUpdate: (checklist: DailyChecklist) => void;
  onBack: () => void;
}

export default function ChecklistView({ checklist, onUpdate, onBack }: ChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items);

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    const newItems = items.map(item => 
      item.id === itemId ? { 
        ...item, 
        ...updates,
        // Auto-complete item when a value is selected
        completed: updates.value !== undefined ? updates.value !== null : item.completed
      } : item
    );
    setItems(newItems);
    
    // Auto-save
    const completedCount = newItems.filter(item => item.completed).length;
    const totalRequired = newItems.filter(item => item.required).length;
    const completedRequired = newItems.filter(item => item.required && item.completed).length;
    
    let status: DailyChecklist['status'] = 'pending';
    if (completedRequired === totalRequired && completedCount === newItems.length) {
      status = 'completed';
    } else if (completedCount > 0) {
      status = 'partial';
    }

    const updatedChecklist: DailyChecklist = {
      ...checklist,
      items: newItems,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };

    onUpdate(updatedChecklist);
  };

  const saveAndComplete = () => {
    const requiredItems = items.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    
    if (completedRequired.length < requiredItems.length) {
      toast({
        title: "Controlli obbligatori mancanti",
        description: `Completa tutti i ${requiredItems.length} controlli obbligatori prima di finalizzare.`,
        variant: "destructive"
      });
      return;
    }

    const completedChecklist: DailyChecklist = {
      ...checklist,
      items,
      status: 'completed',
      completedAt: new Date().toISOString()
    };

    onUpdate(completedChecklist);
    toast({
      title: "Checklist completata!",
      description: "Tutti i controlli sono stati salvati correttamente.",
    });
    onBack();
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalItems = items.length;
  const requiredCount = items.filter(item => item.required).length;
  const completedRequired = items.filter(item => item.required && item.completed).length;

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Torna alla Dashboard
        </Button>
        <div className="text-right">
          <div className="text-sm font-medium">
            Turno {checklist.shift} - {new Date(checklist.date).toLocaleDateString('it-IT')}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progresso Checklist</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {completedCount}/{totalItems} totali
              </Badge>
              <Badge className={completedRequired === requiredCount ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                {completedRequired}/{requiredCount} obbligatori
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalItems) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="font-medium">{item.description}</p>
                      {item.required && (
                        <Badge variant="outline" className="text-xs">
                          Obbligatorio
                        </Badge>
                      )}
                      {item.value && (
                        <Badge className={item.value === 'si' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                          {item.value.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <RadioGroup 
                      value={item.value || ''} 
                      onValueChange={(value) => updateItem(item.id, { value: value as 'si' | 'no' })}
                      className="flex gap-6 mb-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id={`${item.id}-si`} />
                        <Label htmlFor={`${item.id}-si`} className="text-success font-medium cursor-pointer">
                          SÌ
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${item.id}-no`} />
                        <Label htmlFor={`${item.id}-no`} className="text-destructive font-medium cursor-pointer">
                          NO
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {/* Campo per inserimento nome per task di pulizia */}
                    {(item.category === 'Pulizia Ambulanza Eseguita Da' || 
                      item.category === 'Carrozzeria' || 
                      item.category === 'Turno') && (
                      <div className="mb-3">
                        <Label className="text-sm font-medium mb-2 block">Nome:</Label>
                        <Input
                          placeholder="Inserisci nome..."
                          value={item.assignedTo || ''}
                          onChange={(e) => updateItem(item.id, { assignedTo: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    <Textarea
                      placeholder="Note aggiuntive (opzionale)"
                      value={item.notes || ''}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3 pt-4">
        <Button 
          onClick={saveAndComplete}
          disabled={completedRequired < requiredCount}
          className="flex-1 bg-success text-success-foreground hover:bg-success/90"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Completa Checklist
        </Button>
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" />
          Salva Bozza
        </Button>
      </div>
    </div>
  );
}