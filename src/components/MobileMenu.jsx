// src/components/MobileMenu.jsx
import { useState } from 'react'

export function MobileMenu({ children, button }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {button}
      </div>
      
      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 998
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            background: '#ede8de',
            zIndex: 999,
            overflowY: 'auto',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={() => setIsOpen(false)} className="btn-ghost" style={{ padding: '8px' }}>✕</button>
              </div>
              {children}
            </div>
          </div>
        </>
      )}
    </>
  )
}
