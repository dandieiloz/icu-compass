// src/components/Modal.tsx

import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  titleId?: string; // For accessibility
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, titleId }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Close modal on 'Escape' key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
        <button onClick={onClose} className="modal-close-button" aria-label="Close modal">
          &times;
        </button>
      </div>
    </div>
  );
};

export default Modal;