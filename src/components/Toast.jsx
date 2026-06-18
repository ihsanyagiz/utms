import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const { message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" style={{ color: 'var(--color-success)' }} size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon" style={{ color: 'var(--color-danger)' }} size={20} />;
      case 'warning':
        return <AlertCircle className="toast-icon" style={{ color: 'var(--color-warning)' }} size={20} />;
      case 'info':
      default:
        return <Info className="toast-icon" style={{ color: 'var(--color-info)' }} size={20} />;
    }
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {getIcon()}
        <div style={{ flexGrow: 1 }}>{message}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
