interface PolicyCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onViewPolicy: () => void;
  required?: boolean;
}

export function PolicyCheckbox({ 
  id, 
  label, 
  checked, 
  onChange, 
  onViewPolicy, 
  required 
}: PolicyCheckboxProps) {
  return (
    <div className="policy-checkbox">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
      />
      <label htmlFor={id}>
        {label}
        <button 
          type="button" 
          onClick={onViewPolicy}
          className="policy-link"
        >
          lire la politique
        </button>
      </label>
    </div>
  );
}