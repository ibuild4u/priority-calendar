import React from 'react'
// src/build_000_002/components/ThemePicker.jsx
import { THEMES } from '../constants/themes'

export function ThemePicker({ currentTheme, onThemeChange, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        fontFamily: "'IBM Plex Mono', monospace"
      }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Choose Your Theme</h2>
        <p style={{ marginBottom: '20px', fontSize: '12px', color: '#7a6e62' }}>
          Select a theme that matches your style
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(THEMES).map(([key, theme]) => (
            <div
              key={key}
              onClick={() => onThemeChange(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                border: currentTheme === key ? '2px solid #27ae60' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: currentTheme === key ? '#f0fdf4' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${theme.colors.headerBg} 0%, ${theme.colors.background} 100%)`,
                border: '1px solid #ddd'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{theme.name}</div>
                <div style={{ fontSize: '11px', color: '#7a6e62' }}>{theme.description}</div>
              </div>
              {currentTheme === key && (
                <div style={{ color: '#27ae60', fontSize: '20px' }}>✓</div>
              )}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            className="btn-solid"
            style={{ padding: '8px 20px' }}
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  )
}

