'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* Champ mot de passe avec bouton œil pour afficher/masquer la saisie.
   `style` = style du <input> ; son marginBottom est reporté sur le wrapper
   pour que l'œil reste centré verticalement. */
export default function PasswordInput({ value, onChange, placeholder = '••••••••', required, autoComplete = 'current-password', style = {} }) {
  const [show, setShow] = useState(false);
  const { marginBottom, ...inputStyle } = style;
  return (
    <div style={{ position: 'relative', marginBottom }}>
      <input
        type={show ? 'text' : 'password'}
        required={required} placeholder={placeholder} autoComplete={autoComplete}
        value={value} onChange={onChange}
        style={{ ...inputStyle, marginBottom: 0, paddingRight: 46, width: '100%', boxSizing: 'border-box' }}
      />
      <button
        type="button" onClick={() => setShow(s => !s)}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 6,
          color: show ? 'var(--lime)' : 'rgba(255,255,255,0.4)', display: 'flex',
        }}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
