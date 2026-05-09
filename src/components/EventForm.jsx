import React from 'react'
import { useState, useEffect } from 'react'
import { DaySelector } from './DaySelector'
import { parseTime, formatTime, parseDuration, formatDuration } from '../utils/helpers'

export function EventForm({ 
  activeBucket, addEventDays, toggleDaySelection, showDaySelector, setShowDaySelector,
  addEventStartTime, setAddEventStartTime, 
  addEventEndTime, setAddEventEndTime,
  addEventDuration, setAddEventDuration,
  addEventLabel, setAddEventLabel, 
  addEvent, externalEventError, conflictPreview, confirmOverride, cancelOverride
}) {
  const [lastChanged, setLastChanged] = useState(null)
  const [localError, setLocalError] = useState('')

  const setEventErrorLocal = (msg) => {
    setLocalError(msg)
  }

  const calculateDurationFromTimes = (startStr, endStr) => {
    const startMin = parseTime(startStr)
    const endMin = parseTime(endStr)
    
    if (startMin !== null && endMin !== null && endMin > startMin) {
      const durationMins = endMin - startMin
      const formattedDuration = formatDuration(durationMins)
      if (formattedDuration !== '—' && formattedDuration !== addEventDuration) {
        setAddEventDuration(formattedDuration)
      }
      return durationMins
    }
    return null
  }

  const calculateEndTimeFromDuration = (startStr, durationStr) => {
    const startMin = parseTime(startStr)
    const durationMins = parseDuration(durationStr)
    
    if (startMin !== null && durationMins !== null && durationMins > 0) {
      const endMin = startMin + durationMins
      if (endMin <= 24 * 60) {
        const formattedEndTime = formatTime(endMin)
        if (formattedEndTime !== addEventEndTime) {
          setAddEventEndTime(formattedEndTime)
        }
        return true
      } else {
        setEventErrorLocal('Event would extend beyond midnight')
        return false
      }
    }
    return false
  }

  const calculateStartTimeFromDuration = (endStr, durationStr) => {
    const endMin = parseTime(endStr)
    const durationMins = parseDuration(durationStr)
    
    if (endMin !== null && durationMins !== null && durationMins > 0) {
      const startMin = endMin - durationMins
      if (startMin >= 0) {
        const formattedStartTime = formatTime(startMin)
        if (formattedStartTime !== addEventStartTime) {
          setAddEventStartTime(formattedStartTime)
        }
        return true
      } else {
        setEventErrorLocal('Event would start before midnight')
        return false
      }
    }
    return false
  }

  const handleStartTimeChange = (value) => {
    setAddEventStartTime(value)
    setLastChanged('start')
    setLocalError('')
    
    if (addEventEndTime && parseTime(addEventEndTime)) {
      calculateDurationFromTimes(value, addEventEndTime)
    }
    else if (addEventDuration && parseDuration(addEventDuration)) {
      calculateEndTimeFromDuration(value, addEventDuration)
    }
  }

  const handleEndTimeChange = (value) => {
    setAddEventEndTime(value)
    setLastChanged('end')
    setLocalError('')
    
    if (addEventStartTime && parseTime(addEventStartTime)) {
      calculateDurationFromTimes(addEventStartTime, value)
    }
    else if (addEventDuration && parseDuration(addEventDuration)) {
      calculateStartTimeFromDuration(value, addEventDuration)
    }
  }

  const handleDurationChange = (value) => {
    setAddEventDuration(value)
    setLastChanged('duration')
    setLocalError('')
    
    const durationMins = parseDuration(value)
    if (!durationMins || durationMins <= 0) return
    
    if (addEventStartTime && parseTime(addEventStartTime)) {
      calculateEndTimeFromDuration(addEventStartTime, value)
    }
    else if (addEventEndTime && parseTime(addEventEndTime)) {
      calculateStartTimeFromDuration(addEventEndTime, value)
    }
  }

  useEffect(() => {
    if (activeBucket) {
      setLastChanged(null)
    }
  }, [activeBucket?.id])

  if (!activeBucket) return null

  const startMin = parseTime(addEventStartTime)
  const endMin = parseTime(addEventEndTime)
  const hasValidTimes = startMin !== null && endMin !== null && endMin > startMin
  const formattedDuration = hasValidTimes ? formatDuration(endMin - startMin) : null

  const displayError = localError || externalEventError

  return (
    <div style={{ background: "#e4ddd2", borderBottom: "1px solid #d0c8bc", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: activeBucket.color.light }} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>P{activeBucket.priority}: {activeBucket.name}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#7a6e62' }}>🕐</span>
          <input 
            placeholder="Start (9am / 14:30)" 
            value={addEventStartTime} 
            onChange={(e) => handleStartTimeChange(e.target.value)} 
            style={{ width: 110, fontSize: 11 }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#7a6e62' }}>🏁</span>
          <input 
            placeholder="End (5pm / 17:00)" 
            value={addEventEndTime} 
            onChange={(e) => handleEndTimeChange(e.target.value)} 
            style={{ width: 110, fontSize: 11 }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#7a6e62' }}>⏱️</span>
          <input 
            placeholder="Duration (1h30m / 90m)" 
            value={addEventDuration} 
            onChange={(e) => handleDurationChange(e.target.value)} 
            style={{ width: 100, fontSize: 11, background: hasValidTimes ? '#e8e2d6' : '#ece7dc' }}
          />
        </div>
        
        {hasValidTimes && !addEventDuration && (
          <span style={{ fontSize: 10, color: '#27ae60', background: '#e8f5e9', padding: '2px 6px', borderRadius: '3px' }}>
            → {formattedDuration}
          </span>
        )}
        
        <input 
          placeholder="Label (optional)" 
          value={addEventLabel} 
          onChange={e => setAddEventLabel(e.target.value)} 
          style={{ width: 140, fontSize: 11 }} 
        />
        
        <button className="btn-ghost" onClick={() => setShowDaySelector(!showDaySelector)} 
          style={{ background: addEventDays.length > 0 ? "#3a3028" : "transparent", color: addEventDays.length > 0 ? "white" : "#7a6e62", fontSize: 11 }}>
          📅 {addEventDays.length} day{addEventDays.length !== 1 ? "s" : ""} selected
        </button>
        
        <button className="btn-solid" onClick={addEvent} style={{ fontSize: 11 }}>
          + ADD EVENT
        </button>
        
        {displayError && (
          <div style={{ fontSize: 10, color: "#c0392b", background: "#fce4e0", padding: "4px 8px", borderRadius: 3 }}>
            ⚠️ {displayError}
          </div>
        )}
      </div>
      
      <div style={{ fontSize: 9, color: "#9a8e80", display: 'flex', gap: 16 }}>
        <span>💡 Start + End → Duration auto-fills</span>
        <span>💡 Start + Duration → End auto-fills</span>
        <span>💡 End + Duration → Start auto-fills</span>
      </div>
      
      {showDaySelector && (
        <DaySelector 
          addEventDays={addEventDays}
          toggleDaySelection={toggleDaySelection}
          onClose={() => setShowDaySelector(false)}
        />
      )}
      
      {conflictPreview && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#ede8de',
            padding: '24px',
            borderRadius: '8px',
            width: '450px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#c0392b' }}>⚠️ Priority Conflict</h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Lower priority event</strong> (P{activeBucket.priority}: {activeBucket.name}) conflicts with:
              </p>
              <div style={{ background: '#f5f0e8', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                {conflictPreview.conflicts?.map((c, i) => (
                  <div key={i} style={{ marginBottom: '4px', fontSize: '12px' }}>
                    • <strong style={{ color: '#c0392b' }}>{c.bucketName}</strong> (P{c.priority}): {c.time}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#7a6e62', marginBottom: '8px' }}>
                What would you like to do?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => confirmOverride('split')}
                  style={{ padding: '10px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  ✂️ Split & Fit - Adjust event to fit around conflicts
                </button>
                <button 
                  onClick={() => confirmOverride('clip')}
                  style={{ padding: '10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  ⏰ Clip Event - Truncate to fit available time
                </button>
                <button 
                  onClick={() => confirmOverride('override')}
                  style={{ padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  🔓 Override Lower Priority - Remove conflicting lower-priority events
                </button>
                <button 
                  onClick={cancelOverride}
                  style={{ padding: '10px', background: '#7a6e62', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ❌ Cancel - Don't add this event
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '11px', color: '#9a8e80', textAlign: 'center' }}>
              💡 Higher priority (lower number) events lock time from lower priority buckets
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

