import React from 'react'
// src/build_000_002/components/SimpleAuth.jsx
import { useState } from 'react'
import { storageService } from '../services/localStorageService'
import { THEMES } from '../constants/themes'

export function SimpleAuth({ onAuthSuccess }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [showThemeSelect, setShowThemeSelect] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [pendingUsername, setPendingUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    
    // Check if this user has a saved theme preference
    const savedTheme = storageService.getThemePreference(username.trim())
    
    if (savedTheme && savedTheme !== 'default') {
      // User has existing theme preference, just log them in
      storageService.login(username.trim())
      onAuthSuccess(username.trim(), savedTheme)
    } else {
      // New user or no theme saved, show theme picker
      setPendingUsername(username.trim())
      setShowThemeSelect(true)
    }
  }

  const handleThemeSelect = (themeKey) => {
    setSelectedTheme(themeKey)
  }

  const handleThemeConfirm = () => {
    storageService.login(pendingUsername)
    storageService.saveThemePreference(pendingUsername, selectedTheme)
    onAuthSuccess(pendingUsername, selectedTheme)
  }

  if (showThemeSelect) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f0e8',
        fontFamily: "'IBM Plex Mono', monospace"
      }}>
        <div style={{
          background: '#ede8de',
          padding: '32px',
          borderRadius: '8px',
          width: '420px',
          maxWidth: '90%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#1a1a10', fontWeight: 900 }}>
              Choose Your Theme
            </div>
            <div style={{ fontSize: '11px', color: '#9a8e80', marginTop: '8px' }}>
              Welcome, {pendingUsername}!
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {Object.entries(THEMES).map(([key, theme]) => (
              <div
                key={key}
                onClick={() => handleThemeSelect(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  border: selectedTheme === key ? '2px solid #27ae60' : '1px solid #d0c8bc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedTheme === key ? '#e8f5e9' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${theme.colors.headerBg} 0%, ${theme.colors.background} 100%)`,
                  border: '1px solid #ddd'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{theme.name}</div>
                  <div style={{ fontSize: '10px', color: '#9a8e80' }}>{theme.description}</div>
                </div>
                {selectedTheme === key && (
                  <div style={{ color: '#27ae60', fontSize: '18px' }}>✓</div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleThemeConfirm}
            className="btn-solid"
            style={{ width: '100%', padding: '12px' }}
          >
            Continue with {THEMES[selectedTheme]?.name}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f5f0e8',
      fontFamily: "'IBM Plex Mono', monospace"
    }}>
      <div style={{
        background: '#ede8de',
        padding: '40px',
        borderRadius: '8px',
        width: '360px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#1a1a10', fontWeight: 900 }}>
            Priority Lock
          </div>
          <div style={{ fontSize: '11px', color: '#9a8e80', marginTop: '8px' }}>
            Simple Local Calendar
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              marginBottom: '16px',
              borderRadius: '4px'
            }}
            autoFocus
          />
          {error && (
            <div style={{ color: '#c0392b', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn-solid"
            style={{ width: '100%', padding: '12px' }}
          >
            Start Planning →
          </button>
        </form>
        
        <div style={{ fontSize: '10px', color: '#b0a898', textAlign: 'center', marginTop: '20px' }}>
          Your calendars and preferences are saved locally in your browser
        </div>
      </div>
    </div>
  )
}

