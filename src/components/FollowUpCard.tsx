import { type FollowUp } from '../types/database';

interface FollowUpCardProps {
  followUp: FollowUp;
  // Add an onClick prop to make the card interactive
  onClick: () => void;
}

// Define which keys from the FollowUp object represent systems with detailed notes
const FOLLOW_UP_SYSTEMS: (keyof FollowUp)[] = [
    'cns', 'cv', 'respiratory', 'fluidKidney', 'giLiver',
    'hematology', 'infectious', 'skin', 'catheters', 'procedures'
];

const FollowUpCard = ({ followUp, onClick }: FollowUpCardProps) => {
  // Create a brief summary for the card view by listing which systems have notes
  const summaryPoints = FOLLOW_UP_SYSTEMS
    .filter(key => followUp[key] && String(Object.values(followUp[key] as object)).trim() !== '')
    .map(key => key.toString().charAt(0).toUpperCase() + key.toString().slice(1).replace(/([A-Z])/g, ' $1'));

  return (
    // The entire div is now a clickable element
    <div className="follow-up-card" onClick={onClick}>
      <h4>Follow-up from: {followUp.id}</h4>
      
      <p><strong>Updated Systems:</strong> {summaryPoints.length > 0 ? summaryPoints.join(', ') : 'Notes only'}</p>

      {/* Show a snippet of the general notes if they exist */}
      {followUp.notes && (
        <p><strong>Notes:</strong> {followUp.notes.substring(0, 70)}...</p>
      )}

      {followUp.aiSummary && (
        <div className="ai-summary">
          <strong>AI Summary</strong>
          <p>{followUp.aiSummary}</p>
        </div>
      )}
    </div>
  );
};

export default FollowUpCard;