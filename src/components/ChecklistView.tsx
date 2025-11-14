import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, CheckCircle, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { DailyChecklist, ChecklistItem } from '@/types/ambulance';
import SignaturePad from './SignaturePad';
import { validateChecklistNotes, validateAssignedTo } from '@/lib/validation';
import { useOperators } from '@/hooks/useOperators';

interface ChecklistViewProps {
  checklist: DailyChecklist;
  onSave: (checklist: DailyChecklist) => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

export default function ChecklistView({ checklist, onSave, onBack, isSaving }: ChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items);
  const isCompleted = checklist.status === 'completed';
  const { data: operators, isLoading: isLoadingOperators } = useOperators();

  // Pre-compila tutti i campi di default al caricamento
  useEffect(() => {
    if (!isCompleted) {
      setItems(prevItems => 
        prevItems.map(item => {
          // Skip se già ha un valore o è categoria Turno
          if (item.category === 'Turno' || (item.value !== null && item.value !== undefined)) {
            return item;
          }
          
          // Per campi con slider, imposta valore a 50 (1/2)
          if (shouldUseSlider(item.description)) {
            return { 
              ...item, 
              value: '50',
              completed: true 
            };
          }
          
          // Per campi SI/NO normali, imposta a SI
          return { 
            ...item, 
            value: 'si',
            completed: true 
          };
        })
      );
    }
  }, [isCompleted]);

  // Determina se un item deve usare uno slider
  const shouldUseSlider = (description: string): boolean => {
    const sliderKeywords = [
      'ossigeno', 'carburante', 'benzina', 'diesel', 'gasolio',
      'olio', 'liquido', 'acqua', 'radiatore', 'freni', 'tergicristalli'
    ];
    return sliderKeywords.some(keyword => description.toLowerCase().includes(keyword));
  };

  // Converte il valore dello slider in etichetta
  const getSliderLabel = (value: number): string => {
    if (value === 0) return 'Vuoto';
    if (value === 25) return '1/4';
    if (value === 50) return '1/2';
    if (value === 75) return '3/4';
    if (value === 100) return 'Pieno';
    return `${value}%`;
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    if (isCompleted) return; // Prevent updates if checklist is completed
    
    // Validate inputs before updating
    if (updates.notes !== undefined && updates.notes) {
      const notesValidation = validateChecklistNotes(updates.notes);
      if (!notesValidation.valid) {
        toast({
          title: "Errore validazione",
          description: notesValidation.error,
          variant: "destructive"
        });
        return;
      }
    }
    
    if (updates.assignedTo !== undefined && updates.assignedTo) {
      const nameValidation = validateAssignedTo(updates.assignedTo);
      if (!nameValidation.valid) {
        toast({
          title: "Errore validazione",
          description: nameValidation.error,
          variant: "destructive"
        });
        return;
      }
    }
    
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id !== itemId) return item;
        
        const updatedItem = { ...item, ...updates };
        
        // Per la categoria Turno, completare quando ci sono nome e firma
        if (item.category === 'Turno') {
          updatedItem.completed = !!(updatedItem.assignedTo && updatedItem.signature);
        } else {
          // Per altre categorie, completare quando c'è un valore (SI/NO o slider)
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
    <div className="space-y-3 pb-24">
      <div className="flex items-center justify-between py-2">
        <Button variant="ghost" onClick={onBack} size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Button>
        <div className="text-right">
          <div className="text-xs font-medium">
            {checklist.shift.toUpperCase()} - {new Date(checklist.date).toLocaleDateString('it-IT')}
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Progresso</span>
            <div className="flex gap-1.5">
              {isCompleted && (
                <Badge className="bg-success text-success-foreground text-xs">
                  ✓ Completata
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {completedCount}/{totalItems}
              </Badge>
              <Badge className={completedRequired === requiredCount ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground text-xs'}>
                {completedRequired}/{requiredCount} obb.
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-accent h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalItems) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-2" defaultValue={isCompleted ? Object.keys(itemsByCategory) : []}>
        {Object.entries(itemsByCategory).sort(([a], [b]) => {
          if (a === 'Turno') return -1;
          if (b === 'Turno') return 1;
          return a.localeCompare(b);
          }).map(([category, categoryItems]) => {
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          const categoryTotal = categoryItems.length;
          const categoryRequired = categoryItems.filter(item => item.required).length;
          const categoryCompletedRequired = categoryItems.filter(item => item.required && item.completed).length;
          
          return (
            <AccordionItem key={category} value={category} className="border rounded-lg overflow-hidden shadow-sm">
              <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="font-semibold text-sm">{category}</span>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {categoryCompleted}/{categoryTotal}
                    </Badge>
                    {categoryRequired > 0 && (
                      <Badge className={categoryCompletedRequired === categoryRequired ? 'bg-success text-success-foreground text-xs' : 'bg-warning text-warning-foreground text-xs'}>
                        {categoryCompletedRequired}/{categoryRequired} obb.
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-1">
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="border rounded p-2 space-y-2 bg-card">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          {/* Header con descrizione e controllo SI/NO inline */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <p className="font-medium text-sm">{item.description}</p>
                              {item.required && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  OBB
                                </Badge>
                              )}
                            </div>
                            
                            {/* Controlli per categorie diverse da Turno */}
                            {item.category !== 'Turno' && (
                              <>
                                {shouldUseSlider(item.description) ? (
                                  <div className="flex items-center gap-2 shrink-0 min-w-[140px]">
                                    <Label className="text-xs font-semibold whitespace-nowrap">
                                      {item.value ? getSliderLabel(Number(item.value)) : 'N/D'}
                                    </Label>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Label 
                                      htmlFor={`switch-${item.id}`} 
                                      className={`text-xs font-semibold cursor-pointer transition-colors ${
                                        item.value === 'si' ? 'text-success' : item.value === 'no' ? 'text-destructive' : 'text-muted-foreground'
                                      }`}
                                    >
                                      {item.value === 'si' ? (
                                        <span className="flex items-center gap-1">
                                          <Check className="h-3 w-3" /> SÌ
                                        </span>
                                      ) : item.value === 'no' ? (
                                        <span className="flex items-center gap-1">
                                          <X className="h-3 w-3" /> NO
                                        </span>
                                      ) : (
                                        'SI/NO'
                                      )}
                                    </Label>
                                    <Switch
                                      id={`switch-${item.id}`}
                                      checked={item.value === 'si'}
                                      onCheckedChange={(checked) => updateItem(item.id, { value: checked ? 'si' : 'no' })}
                                      disabled={isCompleted}
                                      className="data-[state=checked]:bg-success"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Slider per campi con livelli (ossigeno, carburante, liquidi) */}
                          {item.category !== 'Turno' && shouldUseSlider(item.description) && (
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Livello:</Label>
                                <span className="text-sm font-bold text-primary">
                                  {getSliderLabel(item.value !== null && item.value !== undefined ? Number(item.value) : 50)}
                                </span>
                              </div>
                              <Slider
                                value={[item.value !== null && item.value !== undefined ? Number(item.value) : 50]}
                                onValueChange={(values) => updateItem(item.id, { value: String(values[0]) })}
                                min={0}
                                max={100}
                                step={25}
                                disabled={isCompleted}
                                className="w-full"
                              />
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Vuoto</span>
                                <span>1/4</span>
                                <span>1/2</span>
                                <span>3/4</span>
                                <span>Pieno</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Campo per selezione operatore per categoria Turno */}
                          {item.category === 'Turno' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Operatore:</Label>
                              <Select
                                value={item.assignedTo || ''}
                                onValueChange={(value) => updateItem(item.id, { assignedTo: value })}
                                disabled={isCompleted || isLoadingOperators}
                              >
                                <SelectTrigger className="w-full h-9 text-sm">
                                  <SelectValue placeholder={isLoadingOperators ? "Caricamento..." : "Seleziona..."} />
                                </SelectTrigger>
                                <SelectContent className="bg-background z-50">
                                  {operators
                                    ?.filter((operator) => {
                                      if (item.description === 'Autista') {
                                        return operator.role.toLowerCase() === 'autista';
                                      } else if (item.description === 'Soccorritore') {
                                        return operator.role.toLowerCase() === 'soccorritore';
                                      }
                                      return true;
                                    })
                                    .map((operator) => (
                                      <SelectItem key={operator.id} value={operator.name}>
                                        {operator.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {/* Campo per inserimento nome per task di pulizia */}
                          {(item.category === 'Pulizia Ambulanza Eseguita Da' || 
                            item.category === 'Carrozzeria') && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Nome:</Label>
                              <Input
                                placeholder="Inserisci nome..."
                                value={item.assignedTo || ''}
                                onChange={(e) => updateItem(item.id, { assignedTo: e.target.value })}
                                className="h-9 text-sm"
                                disabled={isCompleted}
                                maxLength={100}
                              />
                            </div>
                          )}
                          
                          {/* Campo firma per categoria Turno */}
                          {item.category === 'Turno' && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Firma:</Label>
                              <SignaturePad
                                value={item.signature}
                                onChange={(signature) => updateItem(item.id, { signature })}
                                disabled={isCompleted}
                              />
                            </div>
                          )}
                          
                          {/* Note sempre presenti ma compatte */}
                          <Textarea
                            placeholder="Note (opzionale)"
                            value={item.notes || ''}
                            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                            className="min-h-[50px] text-sm"
                            disabled={isCompleted}
                            maxLength={2000}
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
          className="fixed bottom-0 left-0 right-0 w-full bg-background border-t px-3 py-2 flex gap-2 z-10 shadow-lg"
          style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
        >
          <Button 
            onClick={handleComplete}
            disabled={completedRequired < requiredCount || isSaving}
            className="flex-1 bg-success text-success-foreground hover:bg-success/90 h-9"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Salvataggio...' : 'Completa'}
          </Button>
          <Button 
            variant="outline" 
            className="gap-1.5 h-9" 
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salva...' : 'Salva'}
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
