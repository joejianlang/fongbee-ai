import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <input
        className={`
          w-full px-3 py-2.5 rounded-lg text-sm font-medium
          bg-card border border-border-primary
          text-text-primary placeholder:text-text-muted
          outline-none transition-all duration-200
          focus:border-text-accent focus:ring-2 focus:ring-text-accent/10
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <textarea
        className={`
          w-full px-3 py-2.5 rounded-lg text-sm font-medium
          bg-card border border-border-primary
          text-text-primary placeholder:text-text-muted
          outline-none transition-all duration-200
          focus:border-text-accent focus:ring-2 focus:ring-text-accent/10
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
}
