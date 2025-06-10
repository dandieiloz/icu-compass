import React, { useState, useEffect, useRef } from 'react';

interface CustomDatalistProps {
  // Updated to accept categorized suggestions
  suggestions: { [category: string]: string[] };
  name: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CustomDatalist: React.FC<CustomDatalistProps> = ({
  suggestions,
  value,
  onChange,
  ...rest
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten suggestions for filtering, but keep original structure for display
  const allSuggestions = Object.values(suggestions).flat();

  const filteredSuggestions = value
    ? allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSuggestions(true);
    onChange(e);
  };

  const onSuggestionClick = (suggestion: string) => {
    const syntheticEvent = {
      currentTarget: { name: rest.name, value: suggestion },
      target: { name: rest.name, value: suggestion }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
    setShowSuggestions(false);
  };

  return (
    <div className="custom-datalist-container" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        autoComplete="off"
        {...rest}
      />
      {showSuggestions && value && (
        <ul className="suggestions-list">
          {Object.entries(suggestions).map(([category, meds]) => {
            const categoryMeds = meds.filter(med => filteredSuggestions.includes(med));
            if (categoryMeds.length === 0) return null;

            return (
              <React.Fragment key={category}>
                <li className="suggestion-category-header">{category}</li>
                {categoryMeds.map(med => (
                  <li key={med} onClick={() => onSuggestionClick(med)} className="suggestion-item">
                    {med}
                  </li>
                ))}
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
};