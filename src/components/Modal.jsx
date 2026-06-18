import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  title, 
  onClose, 
  onConfirm, 
  confirmText = 'Onayla', 
  confirmType = 'primary', 
  children 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
          {onConfirm && (
            <button className={`btn btn-${confirmType}`} onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
