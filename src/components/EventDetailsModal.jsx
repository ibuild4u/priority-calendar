// src/components/EventDetailsModal.jsx
import { useState } from 'react'
import { formatTime, formatDuration, parseTime, parseDuration } from '../utils/helpers'

export function EventDetailsModal({ event, bucket, onClose, onEdit, onDelete, colors }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(event.label)
  const [editStartTime, setEditStartTime] = useState(formatTime(event.startMin))
  const [editDuration, setEditDuration] = useState(formatDuration(event.durationMins))

  const handleSave = () => {
    const newStartMin = parseTime(editStartTime)
    const newDurationMins = parseDuration(editDuration)
    
    if (newStartMin === null) {
      alert('Invalid start time')
      return
    }
    if (newDurationMins === null || newDurationMins < 15) {
      alert('Invalid duration (min 15 minutes)')
      return
    }
    
    onEdit(event.id, event.bucketId, {
      label: editLabel,
      startMin: newStartMin,
      durationMins: newDurationMins
    })
    setIsEditing(false)
  }

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
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: colors.sidebarBg,
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.sidebarBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Event Details</h3>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
        </div>
        
        <div style={{ padding: '16px' }}>
          {isEditing ? (
            <>
              <input 
                value={editLabel} 
                onChange={(e) => setEditLabel(e.target.value)} 
                style={{ width: '100%', marginBottom: '12px' }}
                placeholder="Event label"
              />
              <input 
                value={editStartTime} 
                onChange={(e) => setEditStartTime(e.target.value)} 
                style={{ width: '100%', marginBottom: '12px' }}
                placeholder="Start time (9am, 14:30)"
              />
              <input 
                value={editDuration} 
                onChange={(e) => setEditDuration(e.target.value)} 
                style={{ width: '100%', marginBottom: '16px' }}
                placeholder="Duration (1h30m, 90m)"
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-solid" onClick={handleSave} style={{ flex: 1 }}>Save</button>
                <button className="btn-ghost" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: 11, color: '#9a8e80', marginBottom: 4 }}>Event</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{event.label}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: 11, color: '#9a8e80', marginBottom: 4 }}>Time</div>
                <div>{formatTime(event.startMin)} - {formatTime(event.startMin + event.durationMins)}</div>
                <div style={{ fontSize: 12, color: '#4caf50' }}>({formatDuration(event.durationMins)})</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: 11, color: '#9a8e80', marginBottom: 4 }}>Bucket</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: bucket.color.bg }} />
                  <span>{bucket.name} (P{bucket.priority})</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ghost" onClick={() => setIsEditing(true)} style={{ flex: 1 }}>✎ Edit</button>
                <button className="btn-solid" onClick={onDelete} style={{ flex: 1, background: '#c0392b', borderColor: '#c0392b' }}>🗑 Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
