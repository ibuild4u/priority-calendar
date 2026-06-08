import React from 'react'
import { useState } from 'react'
import { formatTime, parseTime, formatDuration } from '../utils/helpers'

export function EventBlock({ event, bucketColor, onRemove, onEdit, isActive, onClick }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(event.label)
  const [editStartTime, setEditStartTime] = useState(formatTime(event.startMin))
  const [editDuration, setEditDuration] = useState(formatDuration(event.durationMins))

  const handleSave = () => {
    const newStartMin = parseTime(editStartTime)
    const newDurationMins = parseDuration(editDuration)
    
    if (newStartMin === null) {
      alert('Invalid start time. Use format like 9am, 14:30, or 2:00pm')
      return
    }
    
    if (newDurationMins === null || newDurationMins < 15) {
      alert('Invalid duration. Minimum 15 minutes. Use format like 1h30m or 90m')
      return
    }
    
    const newEndMin = newStartMin + newDurationMins
    if (newEndMin > 24 * 60) {
      alert('Event would extend beyond midnight')
      return
    }
    
    onEdit(event.id, event.bucketId, {
      label: editLabel.trim(),
      startMin: newStartMin,
      durationMins: newDurationMins
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditLabel(event.label)
    setEditStartTime(formatTime(event.startMin))
    setEditDuration(formatDuration(event.durationMins))
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="event-block-editing" style={{
        position: "absolute",
        left: event.leftPos,
        top: event.topPos - 2,
        height: event.height + 4,
        width: Math.max(event.width, 200),
        background: bucketColor.bg,
        borderLeft: `4px solid ${bucketColor.light}`,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        padding: "4px",
        gap: "4px",
        zIndex: 20,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
      }}>
        <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={{ fontSize: 9, padding: "2px 4px", borderRadius: "2px", border: "1px solid #ccc", background: "white", width: "100%" }} autoFocus />
        <div style={{ display: "flex", gap: "4px" }}>
          <input type="text" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} placeholder="Start" style={{ fontSize: 8, padding: "2px 4px", borderRadius: "2px", border: "1px solid #ccc", background: "white", width: "45%" }} />
          <input type="text" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="Duration" style={{ fontSize: 8, padding: "2px 4px", borderRadius: "2px", border: "1px solid #ccc", background: "white", width: "45%" }} />
        </div>
        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
          <button onClick={handleSave} style={{ fontSize: 7, padding: "2px 6px", background: "#27ae60", color: "white", border: "none", borderRadius: "2px", cursor: "pointer" }}>Save</button>
          <button onClick={handleCancel} style={{ fontSize: 7, padding: "2px 6px", background: "#7a6e62", color: "white", border: "none", borderRadius: "2px", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="event-block" style={{
      position: "absolute",
      left: event.leftPos,
      top: event.topPos,
      height: event.height,
      width: Math.max(event.width, 36),
      background: bucketColor.bg,
      borderLeft: `4px solid ${bucketColor.light}`,
      borderRadius: 3,
      opacity: isActive ? 1 : 0.85,
      display: "flex",
      alignItems: "center",
      padding: "0 24px 0 8px",
      overflow: "hidden",
      zIndex: 5,
      cursor: 'pointer',
      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
    }} onClick={onClick}>
      <div style={{ fontSize: 8, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: 'pointer' }} onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        {event.label}
      </div>
      {event.width > 60 && (
        <div style={{ fontSize: 7, color: "#ffffffcc", marginLeft: 5, whiteSpace: "nowrap" }}>
          {formatTime(event.startMin)}-{formatTime(event.startMin + event.durationMins)}
        </div>
      )}
      <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} style={{ background: "rgba(255,255,255,0.3)", border: "none", color: "white", fontSize: 8, borderRadius: 2, padding: "1px 4px", cursor: "pointer", opacity: 0.7 }}>✎</button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(event.bucketId, event.id); }} style={{ background: "rgba(0,0,0,0.55)", border: "none", color: "white", fontSize: 9, borderRadius: 2, padding: "1px 5px", cursor: "pointer", opacity: 0 }} className="del-btn">✕</button>
      </div>
    </div>
  )
}
