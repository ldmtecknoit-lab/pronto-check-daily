import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { DailyChecklist, ChecklistItem } from '@/types/ambulance';
import SignaturePad from './SignaturePad';

interface ChecklistViewProps {
  checklist: DailyChecklist;
  onSave: (checklist: DailyChecklist) => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

export default function ChecklistView({ checklist, onSave, onBack, isSaving }: ChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items);
  const isCompleted = checklist.status === 'completed';

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    if (isCompleted) return; // Prevent updates if checklist is completed
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id !== itemId) return item;
        
        const updatedItem = { ...item, ...updates };
        
        // Per la categoria Turno, completare quando ci sono nome e firma
        if (item.category === 'Turno') {
          updatedItem.completed = !!(updatedItem.assignedTo && updatedItem.signature);
        } else {
          // Per altre categorie, completare quando c'è un valore SI/NO
          updatedItem.completed = updates.value !== undefined ? updates.value !== null : item.completed;
        }
        
        return updatedItem;
      })
    );
  };

  const calculateStatus = (): DailyChecklist['status'] => {
    const completedCount = items.filter(item => item.completed).length;
    const totalRequired = items.filter(item => item.required).length;
    const completedRequired = items.filter(item => item.required && item.completed).length;
    
    if (completedRequired === totalRequired && completedCount === items.length) {
      return 'completed';
    } else if (completedCount > 0) {
      return 'partial';
    }
    return 'pending';
  };

  const handleSave = async () => {
    const status = calculateStatus();
    const updatedChecklist: DailyChecklist = {
      ...checklist,
      items,
      status
    };

    await onSave(updatedChecklist);
    
    toast({
      title: "Salvato",
      description: "Le modifiche sono state salvate sul database.",
    });
  };

  const handleComplete = async () => {
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
      completedAt: new Date().toISOString(),
      completedBy: 'Operatore'
    };

    await onSave(completedChecklist);
    
    toast({
      title: "Checklist completata!",
      description: "Tutti i controlli sono stati salvati.",
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
    <div className="space-y-6 pb-24">
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
              {isCompleted && (
                <Badge className="bg-success text-success-foreground">
                  Completata
                </Badge>
              )}
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

      <Accordion type="multiple" className="space-y-4" defaultValue={isCompleted ? Object.keys(itemsByCategory) : []}>
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => {
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          const categoryTotal = categoryItems.length;
          const categoryRequired = categoryItems.filter(item => item.required).length;
          const categoryCompletedRequired = categoryItems.filter(item => item.required && item.completed).length;
          
          return (
            <AccordionItem key={category} value={category} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-lg">{category}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {categoryCompleted}/{categoryTotal}
                    </Badge>
                    {categoryRequired > 0 && (
                      <Badge className={categoryCompletedRequired === categoryRequired ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                        {categoryCompletedRequired}/{categoryRequired} obbligatori
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-4">
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
                          
                          {/* Radio buttons SI/NO solo per categorie diverse da Turno */}
                          {item.category !== 'Turno' && (
                            <RadioGroup 
                              value={item.value || ''} 
                              onValueChange={(value) => updateItem(item.id, { value: value as 'si' | 'no' })}
                              className="flex gap-6 mb-3"
                              disabled={isCompleted}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="si" id={`${item.id}-si`} disabled={isCompleted} />
                                <Label htmlFor={`${item.id}-si`} className="text-success font-medium cursor-pointer">
                                  SÌ
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id={`${item.id}-no`} disabled={isCompleted} />
                                <Label htmlFor={`${item.id}-no`} className="text-destructive font-medium cursor-pointer">
                                  NO
                                </Label>
                              </div>
                            </RadioGroup>
                          )}
                          
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
                                disabled={isCompleted}
                              />
                            </div>
                          )}
                          
                          {/* Campo firma per categoria Turno */}
                          {item.category === 'Turno' && (
                            <div className="mb-3">
                              <Label className="text-sm font-medium mb-2 block">Firma:</Label>
                              <SignaturePad
                                value={item.signature}
                                onChange={(signature) => updateItem(item.id, { signature })}
                                disabled={isCompleted}
                              />
                            </div>
                          )}
                          
                          <Textarea
                            placeholder="Note aggiuntive (opzionale)"
                            value={item.notes || ''}
                            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                            className="min-h-[60px]"
                            disabled={isCompleted}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {!isCompleted && (
        <div 
          className="fixed bottom-0 left-0 right-0 w-full bg-background border-t px-4 pt-4 flex gap-3 z-10"
          style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }} // 1rem è il p-4 standard di tailwind
        >
          <Button 
            onClick={handleComplete}
            disabled={completedRequired < requiredCount || isSaving}
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Completa Checklist'}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      )}
      
      {isCompleted && (
        <div 
          className="fixed bottom-0 left-0 right-0 w-full bg-background border-t p-4 z-10"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Checklist completata e salvata - Non modificabile</span>
          </div>
        </div>
      )}
    </div>
  );
}
