import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'https://your-project-ref.supabase.co' && 
                      supabaseAnonKey !== 'your-anon-key';

  if (isConfigured) {
    return null; // Non mostrare nulla se è configurato correttamente
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Configurazione Supabase Necessaria
          </CardTitle>
          <CardDescription>
            Le credenziali Supabase non sono configurate. Segui questi passaggi per completare la configurazione.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Credenziali Mancanti</AlertTitle>
            <AlertDescription>
              URL: {supabaseUrl || 'Non configurato'}<br/>
              Anon Key: {supabaseAnonKey ? 'Configurata' : 'Non configurata'}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">Come configurare Supabase:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Vai al tuo <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">dashboard Supabase</a></li>
              <li>Seleziona il tuo progetto</li>
              <li>Vai su <strong>Settings → API</strong></li>
              <li>Copia l'<strong>URL</strong> e la <strong>anon/public key</strong></li>
              <li>Crea un file <code className="bg-muted px-1 rounded">.env</code> nella root del progetto:</li>
            </ol>
            
            <div className="bg-muted p-3 rounded-md text-sm font-mono">
              <div>VITE_SUPABASE_URL=https://your-project-ref.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your-anon-key-here</div>
            </div>

            <p className="text-sm text-muted-foreground">
              Sostituisci i valori con le tue credenziali reali dal dashboard Supabase.
            </p>
          </div>

          <Button asChild className="w-full">
            <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
              Apri Dashboard Supabase
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConfig;