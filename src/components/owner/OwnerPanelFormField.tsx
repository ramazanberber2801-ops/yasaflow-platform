import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  getOwnerPanelFieldErrorId,
  type OwnerOrganizationDraft,
} from '../../lib/ownerPanelValidation';

type FieldName = keyof OwnerOrganizationDraft;

type OwnerPanelFormFieldProps = {
  field: FieldName;
  label: string;
  error?: string;
  children: ReactNode;
};

export function OwnerPanelFormField({
  field,
  label,
  error,
  children,
}: OwnerPanelFormFieldProps) {
  const errorId = getOwnerPanelFieldErrorId(field);

  return (
    <div>
      <label
        htmlFor={`owner-panel-${field}`}
        className="mb-1 block text-[10px] uppercase tracking-wide opacity-45"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type OwnerPanelTextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'aria-invalid' | 'aria-describedby'
> & {
  field: FieldName;
  error?: string;
};

export const OwnerPanelTextInput = forwardRef<
  HTMLInputElement,
  OwnerPanelTextInputProps
>(function OwnerPanelTextInput({ field, error, className = '', ...props }, ref) {
  const errorId = getOwnerPanelFieldErrorId(field);

  return (
    <input
      {...props}
      ref={ref}
      id={`owner-panel-${field}`}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        error ? 'border-red-500 focus:ring-red-200' : ''
      } ${className}`}
    />
  );
});
