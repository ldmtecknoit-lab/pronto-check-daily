export type ShiftType = 'mattina' | 'pomeriggio' | 'sera';

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  completed: boolean;
  required: boolean;
  notes?: string;
}

export interface DailyChecklist {
  id: string;
  date: string;
  shift: ShiftType;
  items: ChecklistItem[];
  completedAt?: string;
  completedBy?: string;
  status: 'pending' | 'completed' | 'partial';
}

export interface ChecklistHistory {
  checklists: DailyChecklist[];
}

export const CHECKLIST_TEMPLATE: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  // Equipaggiamenti di emergenza
  { category: 'Equipaggiamenti di Emergenza', description: 'Defibrillatore funzionante e carico', required: true },
  { category: 'Equipaggiamenti di Emergenza', description: 'Bombole ossigeno piene', required: true },
  { category: 'Equipaggiamenti di Emergenza', description: 'Aspiratore portatile funzionante', required: true },
  { category: 'Equipaggiamenti di Emergenza', description: 'Monitor parametri vitali', required: true },
  { category: 'Equipaggiamenti di Emergenza', description: 'Barella principale', required: true },
  { category: 'Equipaggiamenti di Emergenza', description: 'Barella cucchiaio', required: true },
  
  // Farmaci e materiali sanitari
  { category: 'Farmaci e Materiali', description: 'Kit farmaci emergenza completo', required: true },
  { category: 'Farmaci e Materiali', description: 'Materiale per medicazioni', required: true },
  { category: 'Farmaci e Materiali', description: 'Collari cervicali varie misure', required: true },
  { category: 'Farmaci e Materiali', description: 'Materiale per immobilizzazione', required: true },
  { category: 'Farmaci e Materiali', description: 'Kit per accessi venosi', required: true },
  
  // Controlli veicolo
  { category: 'Veicolo', description: 'Livelli fluidi (olio, refrigerante, freni)', required: true },
  { category: 'Veicolo', description: 'Pneumatici in buono stato', required: true },
  { category: 'Veicolo', description: 'Sirene e lampeggianti funzionanti', required: true },
  { category: 'Veicolo', description: 'Radio di comunicazione', required: true },
  { category: 'Veicolo', description: 'Carburante sufficiente (>75%)', required: true },
  { category: 'Veicolo', description: 'Kit di emergenza stradale', required: true },
  
  // Pulizia e igienizzazione
  { category: 'Pulizia', description: 'Sanificazione interna completata', required: true },
  { category: 'Pulizia', description: 'Pulizia e disinfezione barelle', required: true },
  { category: 'Pulizia', description: 'Controllo scorte materiale monouso', required: false },
  { category: 'Pulizia', description: 'Controllo scorte DPI', required: true },
];