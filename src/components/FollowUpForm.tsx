import React from 'react';

const SYSTEMS = [
  'cns', 'cv', 'respiratory', 'fluidKidney', 'giLiver',
  'hematology', 'infectious', 'skin', 'catheters', 'procedures'
];

// The form now receives its state and handlers as props
interface FollowUpFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const FollowUpForm: React.FC<FollowUpFormProps> = ({ formData, handleInputChange, handleSave, isSaving }) => {
  return (
    <form onSubmit={handleSave} className="follow-up-form">
      <h3>Today's Follow-up ({new Date().toLocaleDateString()})</h3>
      {SYSTEMS.map(system => (
        <fieldset key={system}>
          <legend>{system.charAt(0).toUpperCase() + system.slice(1).replace(/([A-Z])/g, ' $1')}</legend>
          <textarea
            name={system}
            value={formData[system] || ''}
            onChange={handleInputChange}
            placeholder={`Notes for ${system}...`}
            rows={2}
          />
        </fieldset>
      ))}
      <fieldset>
        <legend>General Notes</legend>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleInputChange}
          placeholder="Overall plan and notes..."
        ></textarea>
      </fieldset>
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Today\'s Follow-up'}
      </button>
    </form>
  );
};