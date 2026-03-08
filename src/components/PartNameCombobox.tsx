import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_PARTS = [
  'Oil Filter', 'Air Filter', 'Fuel Filter', 'Cabin Filter',
  'Brake Pads', 'Brake Rotors', 'Spark Plugs', 'Battery', 'Alternator',
  'Timing Belt', 'Serpentine Belt', 'Tires', 'Wiper Blades', 'Coolant',
  'Brake Fluid', 'Engine Oil', 'Transmission Fluid', 'Power Steering Fluid',
  'Radiator Hose', 'Thermostat', 'Water Pump', 'CV Joint', 'Wheel Bearing',
  'Shock Absorber', 'Strut', 'Ball Joint', 'Tie Rod End',
  'Headlight Bulb', 'Tail Light Bulb', 'Fuse', 'Drive Belt',
  'Clutch Plate', 'Clutch Bearing', 'Gear Oil',
];

interface PartNameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Normalise for dedup: trim + lowercase */
const norm = (s: string) => s.trim().toLowerCase();

const PartNameCombobox = ({ value, onChange, placeholder = 'Search or type part name...', className }: PartNameComboboxProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch user's historical part names with usage count + recency
  const { data: userParts } = useQuery({
    queryKey: ['user_part_names', user?.id],
    queryFn: async () => {
      // Fetch from both service_logs and spare_parts
      const [slRes, spRes] = await Promise.all([
        supabase.from('service_logs').select('part_name, service_date').order('service_date', { ascending: false }),
        supabase.from('spare_parts').select('part_name, created_at').order('created_at', { ascending: false }),
      ]);

      const countMap = new Map<string, { name: string; count: number; latest: string }>();

      const process = (items: { part_name: string }[] | null, dateField: 'service_date' | 'created_at') => {
        (items || []).forEach((item: any) => {
          const key = norm(item.part_name);
          const existing = countMap.get(key);
          const date = item[dateField] || '';
          if (existing) {
            existing.count++;
            if (date > existing.latest) existing.latest = date;
          } else {
            countMap.set(key, { name: item.part_name, count: 1, latest: date });
          }
        });
      };

      process(slRes.data, 'service_date');
      process(spRes.data, 'created_at');

      return countMap;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build merged, deduplicated list
  const allParts = (() => {
    const seen = new Set<string>();
    const result: { name: string; count: number; latest: string; isRecent: boolean }[] = [];

    // Add user parts first (sorted by count desc, then recency)
    if (userParts) {
      const entries = Array.from(userParts.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.latest.localeCompare(a.latest);
      });
      entries.forEach(e => {
        if (!seen.has(norm(e.name))) {
          seen.add(norm(e.name));
          result.push({ name: e.name, count: e.count, latest: e.latest, isRecent: true });
        }
      });
    }

    // Add defaults that aren't already present
    DEFAULT_PARTS.forEach(p => {
      if (!seen.has(norm(p))) {
        seen.add(norm(p));
        result.push({ name: p, count: 0, latest: '', isRecent: false });
      }
    });

    return result;
  })();

  const searchLower = search.toLowerCase();
  const filtered = allParts.filter(p => p.name.toLowerCase().includes(searchLower));

  // Split into recent (user-used) and defaults
  const recentParts = filtered.filter(p => p.isRecent);
  const defaultParts = filtered.filter(p => !p.isRecent);

  const exactMatch = allParts.some(p => norm(p.name) === norm(search));
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
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg">
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

          {/* Recent / frequently used */}
          {recentParts.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</span>
              </div>
              {recentParts.map(part => (
                <button
                  key={`r-${part.name}`}
                  type="button"
                  onClick={() => selectPart(part.name)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                    norm(value) === norm(part.name) ? 'text-primary font-medium' : 'text-foreground'
                  )}
                >
                  <Check className={cn('h-3.5 w-3.5', norm(value) === norm(part.name) ? 'opacity-100 text-primary' : 'opacity-0')} />
                  <span className="flex-1 text-left">{part.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{part.count}×</span>
                </button>
              ))}
              {defaultParts.length > 0 && <div className="my-1 border-t border-border/30" />}
            </>
          )}

          {/* Default parts */}
          {defaultParts.map(part => (
            <button
              key={`d-${part.name}`}
              type="button"
              onClick={() => selectPart(part.name)}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                norm(value) === norm(part.name) ? 'text-primary font-medium' : 'text-foreground'
              )}
            >
              <Check className={cn('h-3.5 w-3.5', norm(value) === norm(part.name) ? 'opacity-100 text-primary' : 'opacity-0')} />
              {part.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartNameCombobox;
