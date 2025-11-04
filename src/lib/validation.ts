import { z } from 'zod';

// Authentication validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email richiesta')
    .email('Formato email non valido')
    .max(255, 'Email troppo lunga'),
  password: z
    .string()
    .min(8, 'La password deve essere di almeno 8 caratteri')
    .max(100, 'Password troppo lunga'),
});

// Checklist item validation schemas
export const checklistItemSchema = z.object({
  notes: z
    .string()
    .max(2000, 'Note troppo lunghe (massimo 2000 caratteri)')
    .optional()
    .or(z.literal('')),
  assignedTo: z
    .string()
    .max(100, 'Nome troppo lungo (massimo 100 caratteri)')
    .optional()
    .or(z.literal('')),
  signature: z
    .string()
    .regex(/^data:image\//, 'Formato firma non valido')
    .optional()
    .or(z.literal('')),
  value: z.enum(['si', 'no']).optional(),
});

// Validation helper functions
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  try {
    loginSchema.shape.email.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Errore di validazione' };
  }
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  try {
    loginSchema.shape.password.parse(password);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Errore di validazione' };
  }
};

export const validateChecklistNotes = (notes: string): { valid: boolean; error?: string } => {
  try {
    checklistItemSchema.shape.notes.parse(notes);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Errore di validazione' };
  }
};

export const validateAssignedTo = (name: string): { valid: boolean; error?: string } => {
  try {
    checklistItemSchema.shape.assignedTo.parse(name);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Errore di validazione' };
  }
};
