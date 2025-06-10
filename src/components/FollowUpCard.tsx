// src/components/FollowUpCard.tsx

import { type FollowUp } from '../types/database';

interface FollowUpCardProps {
  followUp: FollowUp;
  onGenerateSummary: () => void;
  isAiLoading: boolean;
}

// Explicitly define which system keys are meant to be displayed as objects.
const DISPLAYABLE_SYSTEMS: (keyof FollowUp)[] = [
    'id', 'hematology'
];

const FollowUpCard = ({ followUp, onGenerateSummary, isAiLoading }: FollowUpCardProps) => {
  const systemsToDisplay = DISPLAYABLE_SYSTEMS.filter(
    key => followUp[key] && typeof followUp[key] === 'object'
  );

  return (
    <div className="follow-up-card">
      <h4>{followUp.id}</h4>

      {systemsToDisplay.map(systemKey => (
        <div key={systemKey} className="system-summary">
          <strong>{systemKey.toUpperCase()}</strong>
          <ul>
            {Object.entries(followUp[systemKey as keyof FollowUp] as object).map(([prop, value]) => (
              <li key={prop}>{prop}: {String(value)}</li>
            ))}
          </ul>
        </div>
      ))}
      
      {followUp.notes && (
        <div className="system-summary">
            <strong>Notes</strong>
            <p>{followUp.notes}</p>
        </div>
      )}

      {followUp.aiSummary ? (
        <div className="ai-summary">
          <strong>AI Summary</strong>
          <p>{followUp.aiSummary}</p>
        </div>
      ) : (
        <button onClick={onGenerateSummary} disabled={isAiLoading}>
          {isAiLoading ? 'Generating...' : 'Generate AI Summary'}
        </button>
      )}
    </div>
  );
};

export default FollowUpCard;