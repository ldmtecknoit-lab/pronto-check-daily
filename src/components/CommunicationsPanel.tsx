import { useCommunications } from '@/hooks/useCommunications';
import { CommunicationAlert } from './CommunicationAlert';
import { useState } from 'react';

export const CommunicationsPanel = () => {
  const { communications, loading } = useCommunications();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  if (loading) return null;

  const visibleCommunications = communications.filter(
    comm => !dismissedIds.has(comm.id)
  );

  if (visibleCommunications.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {visibleCommunications.map((communication) => (
        <CommunicationAlert
          key={communication.id}
          communication={communication}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};