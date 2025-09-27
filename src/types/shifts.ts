export interface Operator {
  id: string;
  name: string;
  role: 'autista' | 'soccorritore' | 'medico';
  phone?: string;
  email?: string;
}

export interface WeeklyShift {
  id: string;
  date: string;
  dayName: string;
  shifts: {
    giorno: {
      autista: Operator;
      soccorritore: Operator;
    };
    notte: {
      autista: Operator;
      soccorritore: Operator;
    };
  };
}

export const MOCK_OPERATORS: Operator[] = [
  // Autisti
  { id: '1', name: 'Marco Rossi', role: 'autista', phone: '+39 335 1234567', email: 'marco.rossi@118.it' },
  { id: '2', name: 'Luca Bianchi', role: 'autista', phone: '+39 335 2345678', email: 'luca.bianchi@118.it' },
  { id: '3', name: 'Andrea Verdi', role: 'autista', phone: '+39 335 3456789', email: 'andrea.verdi@118.it' },
  { id: '4', name: 'Giulio Neri', role: 'autista', phone: '+39 335 4567890', email: 'giulio.neri@118.it' },
  { id: '5', name: 'Paolo Ferrari', role: 'autista', phone: '+39 335 5678901', email: 'paolo.ferrari@118.it' },
  { id: '6', name: 'Antonio Romano', role: 'autista', phone: '+39 335 6789012', email: 'antonio.romano@118.it' },
  { id: '7', name: 'Roberto Marino', role: 'autista', phone: '+39 335 7890123', email: 'roberto.marino@118.it' },
  
  // Soccorritori
  { id: '8', name: 'Elena Conti', role: 'soccorritore', phone: '+39 335 8901234', email: 'elena.conti@118.it' },
  { id: '9', name: 'Sara Ricci', role: 'soccorritore', phone: '+39 335 9012345', email: 'sara.ricci@118.it' },
  { id: '10', name: 'Francesca Bruno', role: 'soccorritore', phone: '+39 336 0123456', email: 'francesca.bruno@118.it' },
  { id: '11', name: 'Chiara Gallo', role: 'soccorritore', phone: '+39 336 1234567', email: 'chiara.gallo@118.it' },
  { id: '12', name: 'Matteo Costa', role: 'soccorritore', phone: '+39 336 2345678', email: 'matteo.costa@118.it' },
  { id: '13', name: 'Giovanni Giordano', role: 'soccorritore', phone: '+39 336 3456789', email: 'giovanni.giordano@118.it' },
  { id: '14', name: 'Simone Mancini', role: 'soccorritore', phone: '+39 336 4567890', email: 'simone.mancini@118.it' }
];

// Funzione per generare turni settimanali con dati fittizi
export const generateWeeklyShifts = (): WeeklyShift[] => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Inizia da lunedì

  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const autisti = MOCK_OPERATORS.filter(op => op.role === 'autista');
  const soccorritori = MOCK_OPERATORS.filter(op => op.role === 'soccorritore');

  return days.map((dayName, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    // Assegna operatori in modo rotativo per varietà
    const autista1 = autisti[index % autisti.length];
    const autista2 = autisti[(index + 1) % autisti.length];
    const soccorritore1 = soccorritori[index % soccorritori.length];
    const soccorritore2 = soccorritori[(index + 2) % soccorritori.length];

    return {
      id: `week-${date.getTime()}`,
      date: date.toISOString().split('T')[0],
      dayName,
      shifts: {
        giorno: {
          autista: autista1,
          soccorritore: soccorritore1
        },
        notte: {
          autista: autista2,
          soccorritore: soccorritore2
        }
      }
    };
  });
};