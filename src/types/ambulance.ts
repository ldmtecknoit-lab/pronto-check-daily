export type ShiftType = 'giorno' | 'notte';

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  completed: boolean;
  required: boolean;
  notes?: string;
  value?: 'si' | 'no' | null;
  assignedTo?: string; // For names in cleaning tasks
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
  // Vano Guida
  { category: 'Vano Guida', description: 'Cartellina 118', required: true },
  { category: 'Vano Guida', description: 'DAE Multiparametrico', required: true },
  { category: 'Vano Guida', description: 'Tablet', required: true },
  { category: 'Vano Guida', description: 'Telefono', required: true },
  { category: 'Vano Guida', description: 'Schede Intervento', required: true },
  { category: 'Vano Guida', description: 'Tessera DKV', required: true },
  { category: 'Vano Guida', description: 'Torcia Emergenza', required: true },
  { category: 'Vano Guida', description: 'Luce', required: true },
  { category: 'Vano Guida', description: 'Radio RT + Portatile', required: true },
  { category: 'Vano Guida', description: 'Catene da Neve', required: false },
  { category: 'Vano Guida', description: 'Estintore', required: true },
  { category: 'Vano Guida', description: 'Kit Scasso', required: true },
  
  // Vano Sanitario
  { category: 'Vano Sanitario', description: 'Cartellina 118', required: true },
  { category: 'Vano Sanitario', description: 'DAE Multiparametrico', required: true },
  { category: 'Vano Sanitario', description: 'Tablet', required: true },
  { category: 'Vano Sanitario', description: 'Telefono', required: true },
  { category: 'Vano Sanitario', description: 'Schede Intervento', required: true },
  { category: 'Vano Sanitario', description: 'Tessera DKV', required: true },
  { category: 'Vano Sanitario', description: 'Torcia Emergenza', required: true },
  { category: 'Vano Sanitario', description: 'Luce', required: true },
  { category: 'Vano Sanitario', description: 'Radio RT + Portatile', required: true },
  { category: 'Vano Sanitario', description: 'Catene da Neve', required: false },
  { category: 'Vano Sanitario', description: 'Estintore', required: true },
  { category: 'Vano Sanitario', description: 'Kit Scasso', required: true },
  
  // Materiale Sanitario di Consumo
  { category: 'Materiale Sanitario', description: 'Guanti', required: true },
  { category: 'Materiale Sanitario', description: 'Cerotto Telato', required: true },
  { category: 'Materiale Sanitario', description: 'Ovatta', required: true },
  { category: 'Materiale Sanitario', description: 'Betadine', required: true },
  { category: 'Materiale Sanitario', description: 'Ghiaccio Istantaneo', required: true },
  { category: 'Materiale Sanitario', description: 'Garze Sterili', required: true },
  { category: 'Materiale Sanitario', description: 'Garze Non Sterili', required: true },
  { category: 'Materiale Sanitario', description: 'Telo Isotermico', required: true },
  { category: 'Materiale Sanitario', description: 'Stick Glicemici', required: true },
  { category: 'Materiale Sanitario', description: 'Mascherine O₂', required: true },
  { category: 'Materiale Sanitario', description: 'Occhialini O₂', required: true },
  { category: 'Materiale Sanitario', description: 'Maschere Venturi', required: true },
  { category: 'Materiale Sanitario', description: 'Maschere Reservoir', required: true },
  { category: 'Materiale Sanitario', description: 'Mascherine FFP2', required: true },
  { category: 'Materiale Sanitario', description: 'Mascherine Chirurgiche', required: true },
  { category: 'Materiale Sanitario', description: 'Lenzuolo Monouso', required: true },
  { category: 'Materiale Sanitario', description: 'Deflussore', required: true },
  { category: 'Materiale Sanitario', description: 'Sondini Aspirazione', required: true },
  { category: 'Materiale Sanitario', description: 'Acqua Ossigenata', required: true },
  { category: 'Materiale Sanitario', description: 'Rotolo di Carta', required: true },
  { category: 'Materiale Sanitario', description: 'Agocanula', required: true },
  { category: 'Materiale Sanitario', description: 'Bende Oculari', required: true },
  { category: 'Materiale Sanitario', description: 'Cannule di Guedel', required: true },
  { category: 'Materiale Sanitario', description: 'Mefix', required: true },
  { category: 'Materiale Sanitario', description: 'Garze Tubolari', required: true },
  { category: 'Materiale Sanitario', description: 'Rasoi Monouso', required: true },
  { category: 'Materiale Sanitario', description: 'Siringhe Monouso', required: true },
  
  // Ossigeno
  { category: 'Ossigeno', description: 'Bombola n. 1 (quantità sufficiente)', required: true },
  { category: 'Ossigeno', description: 'Bombola n. 2 (quantità sufficiente)', required: true },
  { category: 'Ossigeno', description: 'Bombola Portatile (quantità sufficiente)', required: true },
  
  // Estintori
  { category: 'Estintori', description: 'Estintore Vano Guida (controllo 6 mesi)', required: true },
  { category: 'Estintori', description: 'Estintore Vano Sanitario (controllo 6 mesi)', required: true },
  
  // Pulizia Ambulanza Eseguita Da
  { category: 'Pulizia Ambulanza Eseguita Da', description: 'Pulizia Ambulanza Eseguita', required: true },
  
  // Carrozzeria
  { category: 'Carrozzeria', description: 'Controllo Carrozzeria', required: true },
  
  // Turno
  { category: 'Turno', description: 'Autista', required: true },
  { category: 'Turno', description: 'Soccorritore', required: true },
  
  // Farmaci
  { category: 'Farmaci', description: 'Betadine Soluzione', required: true },
  { category: 'Farmaci', description: 'Amuchina', required: true },
  { category: 'Farmaci', description: 'Foille Spray', required: true },
  { category: 'Farmaci', description: 'Luan Pomata', required: false },
  { category: 'Farmaci', description: 'Acqua Ossigenata', required: true },
];