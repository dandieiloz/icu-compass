// src/components/DiagnosisSelector.tsx
import React, { useState } from 'react';

interface DiagnosisSelectorProps {
  title: string;
  diagnosisData: { [category: string]: string[] };
  selectedItems: string[];
  onSelectionChange: (newSelection: string[]) => void;
}

export const DiagnosisSelector: React.FC<DiagnosisSelectorProps> = ({
  title,
  diagnosisData,
  selectedItems,
  onSelectionChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleCheckboxChange = (diagnosis: string, isChecked: boolean) => {
    const newSelection = isChecked
      ? [...selectedItems, diagnosis]
      : selectedItems.filter(item => item !== diagnosis);
    onSelectionChange(newSelection);
  };

  const filteredData = Object.keys(diagnosisData).reduce((acc, category) => {
    const filteredDiagnoses = diagnosisData[category].filter(diagnosis =>
      diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredDiagnoses.length > 0) {
      acc[category] = filteredDiagnoses;
    }
    return acc;
  }, {} as { [category: string]: string[] });

  return (
    <div className="diagnosis-selector">
      <h4>{title}</h4>
      <input
        type="text"
        placeholder="Search diagnoses..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <div className="selection-area">
        {Object.entries(filteredData).map(([category, diagnoses]) => (
          <div key={category} className="category-group">
            <h5>{category}</h5>
            {diagnoses.map(diagnosis => (
              <div key={diagnosis} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`${title}-${diagnosis}`}
                  checked={selectedItems.includes(diagnosis)}
                  onChange={e => handleCheckboxChange(diagnosis, e.target.checked)}
                />
                <label htmlFor={`${title}-${diagnosis}`}>{diagnosis}</label>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};