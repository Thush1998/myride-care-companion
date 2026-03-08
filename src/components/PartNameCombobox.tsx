import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMON_PARTS = [
  'Oil Filter',
  'Air Filter',
  'Fuel Filter',
  'Cabin Filter',
  'Brake Pads',
  'Brake Rotors',
  'Spark Plugs',
  'Battery',
  'Alternator',
  'Timing Belt',
  'Serpentine Belt',
  'Tires',
  'Wiper Blades',
  'Coolant',
  'Brake Fluid',
  'Engine Oil',
  'Transmission Fluid',
  'Power Steering Fluid',
  'Radiator Hose',
  'Thermostat',
  'Water Pump',
  'CV Joint',
  'Wheel Bearing',
  'Shock Absorber',
  'Strut',
  'Ball Joint',
  'Tie Rod End',
  'Headlight Bulb',
  'Tail Light Bulb',
  'Fuse',
  'Drive Belt',
  'Clutch Plate',
  'Clutch Bearing',
];

interface PartNameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PartNameCombobox = ({ value, onChange, placeholder = 'Search or type part name...', className }: PartNameComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal search with external value
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COMMON_PARTS.filter(p =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = COMMON_PARTS.some(p => p.toLowerCase() === search.trim().toLowerCase());
  const showCustomOption = search.trim().length > 0 && !exactMatch;

  const selectPart = (part: string) => {
    onChange(part);
    setSearch(part);
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring',
            className
          )}
        />
        <button
          type="button"
          onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg">
          {filtered.length === 0 && !showCustomOption && (
            <p className="py-3 text-center text-xs text-muted-foreground">No parts found.</p>
          )}

          {showCustomOption && (
            <button
              type="button"
              onClick={() => selectPart(search.trim())}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>Add custom: <strong className="text-primary">"{search.trim()}"</strong></span>
            </button>
          )}

          {filtered.map(part => (
            <button
              key={part}
              type="button"
              onClick={() => selectPart(part)}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                value === part ? 'text-primary font-medium' : 'text-foreground'
              )}
            >
              <Check className={cn('h-3.5 w-3.5', value === part ? 'opacity-100 text-primary' : 'opacity-0')} />
              {part}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartNameCombobox;
