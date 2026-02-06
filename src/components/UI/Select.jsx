import ReactSelect from 'react-select'
import CreatableSelect from 'react-select/creatable'

// Custom dark theme styles for react-select
const darkStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderColor: state.isFocused ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '2px 4px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    minHeight: '42px',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#18181b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    zIndex: 100,
    overflow: 'hidden',
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
        ? 'rgba(59, 130, 246, 0.2)'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
    padding: '10px 12px',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#ffffff',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.4)',
  }),
  input: (base) => ({
    ...base,
    color: '#ffffff',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.4)',
    '&:hover': {
      color: 'rgba(255, 255, 255, 0.6)',
    },
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.4)',
    '&:hover': {
      color: '#ef4444',
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#93c5fd',
    padding: '2px 6px',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#93c5fd',
    '&:hover': {
      backgroundColor: '#ef4444',
      color: '#ffffff',
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.5)',
  }),
  loadingMessage: (base) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.5)',
  }),
  group: (base) => ({
    ...base,
    paddingTop: 8,
    paddingBottom: 8,
  }),
  groupHeading: (base) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
    paddingLeft: 12,
  }),
}

// Format option with emoji support
const formatOptionLabel = ({ label, emoji, icon }) => (
  <div className="flex items-center gap-2">
    {emoji && <span>{emoji}</span>}
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </div>
)

// Main Select component
export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  label,
  icon: Icon,
  isMulti = false,
  isSearchable = true,
  isClearable = false,
  isDisabled = false,
  isLoading = false,
  error,
  className = '',
  menuPlacement = 'auto',
}) {
  // Find the selected option(s)
  const selectedValue = isMulti
    ? options.filter(opt => value?.includes(opt.value))
    : options.find(opt => opt.value === value) || null

  const handleChange = (selected) => {
    if (isMulti) {
      onChange(selected ? selected.map(s => s.value) : [])
    } else {
      onChange(selected ? selected.value : '')
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
      )}
      <ReactSelect
        value={selectedValue}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isMulti={isMulti}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        styles={darkStyles}
        formatOptionLabel={formatOptionLabel}
        menuPlacement={menuPlacement}
        classNamePrefix="select"
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}

// Creatable Select (allows creating new options)
export function CreatableSelectField({
  value,
  onChange,
  options = [],
  placeholder = 'Select or create...',
  label,
  icon: Icon,
  isMulti = false,
  isClearable = true,
  isDisabled = false,
  error,
  className = '',
  onCreateOption,
}) {
  const selectedValue = isMulti
    ? options.filter(opt => value?.includes(opt.value))
    : options.find(opt => opt.value === value) || null

  const handleChange = (selected) => {
    if (isMulti) {
      onChange(selected ? selected.map(s => s.value) : [])
    } else {
      onChange(selected ? selected.value : '')
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
      )}
      <CreatableSelect
        value={selectedValue}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isMulti={isMulti}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={darkStyles}
        formatOptionLabel={formatOptionLabel}
        onCreateOption={onCreateOption}
        classNamePrefix="select"
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}

// Simple native select with fixed dark styling (fallback)
export function NativeSelect({
  value,
  onChange,
  options = [],
  placeholder,
  label,
  icon: Icon,
  disabled = false,
  error,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5
          bg-bg-secondary text-text-primary
          border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-red-500' : 'border-border hover:border-border-hover'}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}

export default Select
