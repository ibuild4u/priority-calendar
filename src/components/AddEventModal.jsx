import { useState, useEffect } from 'react'

export function AddEventModal({ buckets, onAdd, onClose, colors, eventError }) {
  const [selectedBucketId, setSelectedBucketId] = useState(null)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [label, setLabel] = useState('')
  const [localError, setLocalError] = useState('')

  // If a priority conflict was detected, parent sets conflictPreview — close so it can show
  // We detect this by checking if onAdd returned null (conflict) — handled in handleSubmit

  const displayError = localError || eventError || ''

  const inputStyle = {
    fontFamily: "'IBM Plex Mono', monospace",
    background: colors.background,
    border: `1px solid ${colors.sidebarBorder}`,
    padding: '9px 11px',
    fontSize: '13px',
    borderRadius: '6px',
    outline: 'none',
    color: colors.buttonPrimary,
    width: '100%',
    boxSizing: 'border-box',
  }

  const handleSubmit = () => {
    setLocalError('')
    if (!selectedBucketId) { setLocalError('Select a bucket'); return }
    if (!date) { setLocalError('Select a date'); return }
    if (!startTime) { setLocalError('Set a start time'); return }
    if (!endTime) { setLocalError('Set an end time'); return }

    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em

    if (endMin <= startMin) { setLocalError('End must be after start'); return }
    if (endMin - startMin < 15) { setLocalError('Minimum 15 minutes'); return }

    const result = onAdd(selectedBucketId, date, startMin, endMin - startMin, label)
    if (result === true || result === null) {
      // true = success, null = conflict modal will take over
      onClose()
    }
    // false = same-bucket overlap; eventError prop will update and show below
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1500, padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={handleKey}
    >
      <div style={{
        background: colors.sidebarBg,
        borderRadius: '10px',
        width: '100%', maxWidth: '420px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 900, color: colors.buttonPrimary }}>
            Add Event
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: colors.buttonSecondary, padding: '0 4px' }}>✕</button>
        </div>

        {/* Bucket selector */}
        <div>
          <div style={{ fontSize: '10px', color: colors.buttonSecondary, marginBottom: '8px', fontWeight: 500, letterSpacing: '0.05em' }}>BUCKET</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {buckets.length === 0 && (
              <div style={{ fontSize: '11px', color: colors.buttonSecondary }}>No buckets yet — create one first</div>
            )}
            {[...buckets].sort((a, b) => a.priority - b.priority).map(b => {
              const active = selectedBucketId === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBucketId(b.id)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: `2px solid ${b.color.bg}`,
                    background: active ? b.color.bg : 'transparent',
                    color: active ? '#fff' : b.color.bg,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  P{b.priority} {b.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <div style={{ fontSize: '10px', color: colors.buttonSecondary, marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em' }}>DATE</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Start / End time */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: colors.buttonSecondary, marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em' }}>START</div>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: colors.buttonSecondary, marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em' }}>END</div>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Label */}
        <div>
          <div style={{ fontSize: '10px', color: colors.buttonSecondary, marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em' }}>LABEL</div>
          <input
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        {/* Error */}
        {displayError && (
          <div style={{ fontSize: '11px', color: colors.errorText, background: colors.errorBg, padding: '8px 10px', borderRadius: '4px' }}>
            ⚠ {displayError}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, padding: '10px' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-solid" style={{ flex: 2, padding: '10px' }}>
            ADD EVENT
          </button>
        </div>
      </div>
    </div>
  )
}
