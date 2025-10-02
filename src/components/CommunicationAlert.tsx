import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Communication {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: number;
  created_at: string;
  expires_at?: string;
}

interface CommunicationAlertProps {
  communication: Communication;
  onDismiss?: (id: string) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getVariant = (type: string) => {
  switch (type) {
    case 'error':
      return 'destructive' as const;
    default:
      return 'default' as const;
  }
};

export const CommunicationAlert = ({ communication, onDismiss }: CommunicationAlertProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(communication.id);
  };

  return (
    <Alert variant={getVariant(communication.type)} className="relative">
      {getIcon(communication.type)}
      <AlertTitle className="pr-8">{communication.title}</AlertTitle>
      <AlertDescription>{communication.message}</AlertDescription>
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 hover:bg-background/80 opacity-70 hover:opacity-100 transition-opacity"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
};