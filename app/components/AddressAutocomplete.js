'use client';
import { useState, useRef } from 'react';
import { geocodeAddress } from '../lib/geocode';

/* Champ adresse/lieu avec suggestions Mapbox. */
export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, inputStyle }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggestions(await geocodeAddress(v.trim()));
    }, 300);
  };

  const handleSelect = (s) => { onSelect(s); setSuggestions([]); setOpen(false); };

  return (
    <div style={{ position: 'relative' }}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={inputStyle}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1200, marginTop: 4,
          background: '#16242f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s, i) => (
            <div key={i} onPointerDown={e => { e.preventDefault(); handleSelect(s); }}
              style={{
                padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,239,11,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
