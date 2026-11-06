import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const SIZES = {
  sm:  'max-w-sm',
  md:  'max-w-lg',
  lg:  'max-w-2xl',
  xl:  'max-w-4xl',
  full: 'max-w-[95vw]',
};

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closable = true,
  className = '',
}) => {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape' && closable) onClose?.();
  }, [closable, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && closable) onClose?.(); }}>
      <div className={clsx('modal-box w-full', SIZES[size] || SIZES.md, className)}>
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07]" style={{ padding: '1.25rem 1.5rem' }}>
            <div>
              {title && <h3 className="text-lg font-bold text-white font-display">{title}</h3>}
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-white/[0.05] flex items-center justify-end gap-3" style={{ padding: '1rem 1.5rem 1.25rem' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
