import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  disabled?: boolean;
}

export default function SignaturePad({ value, onChange, disabled }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (value && sigCanvas.current && !disabled) {
      sigCanvas.current.fromDataURL(value);
    }
  }, [value, disabled]);

  const handleClear = () => {
    if (sigCanvas.current && !disabled) {
      sigCanvas.current.clear();
      onChange('');
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current && !disabled) {
      const signature = sigCanvas.current.toDataURL();
      onChange(signature);
    }
  };

  if (disabled && value) {
    return (
      <Card className="p-4">
        <img src={value} alt="Firma" className="w-full h-[150px] object-contain" />
      </Card>
    );
  }

  if (disabled && !value) {
    return (
      <Card className="p-4">
        <div className="w-full h-[150px] flex items-center justify-center text-muted-foreground">
          Nessuna firma presente
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card className="p-2 bg-background">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-[150px] border border-border rounded touch-action-none',
            style: { touchAction: 'none' }
          }}
          onEnd={handleEnd}
          backgroundColor="white"
        />
      </Card>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClear}
        className="w-full gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Cancella Firma
      </Button>
    </div>
  );
}
