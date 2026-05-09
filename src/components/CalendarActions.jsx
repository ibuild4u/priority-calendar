import React from 'react'
// src/build_000_002/components/CalendarActions.jsx
import { useState, useRef } from 'react'
import { storageService } from '../services/localStorageService'
import { exportService } from '../services/exportService'

export function CalendarActions({ 
  buckets, 
  onCalendarLoaded,
  currentCalendarId,
  setCurrentCalendarId
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [calendarName, setCalendarName] = useState('')
  const [savedCalendars, setSavedCalendars] = useState([])
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef(null)

  const loadSavedList = () => {
    const calendars = storageService.getUserCalendars()
    setSavedCalendars(calendars)
  }

  const handleSave = () => {
    if (!calendarName.trim()) {
      alert('Please enter a calendar name')
      return
    }
    storageService.saveCalendar(buckets, calendarName)
    setShowSaveModal(false)
    setCalendarName('')
    loadSavedList()
    alert('Calendar saved successfully!')
  }

  const handleLoad = (calendarId) => {
    const calendar = storageService.loadCalendar(calendarId)
    if (calendar) {
      onCalendarLoaded(calendar.buckets, calendar.id)
      setCurrentCalendarId(calendar.id)
      setShowMenu(false)
      alert('Loaded: ' + calendar.name)
    }
  }

  const handleDelete = (calendarId, calendarName) => {
    if (confirm('Delete "' + calendarName + '"?')) {
      storageService.deleteCalendar(calendarId)
      loadSavedList()
      if (currentCalendarId === calendarId) {
        onCalendarLoaded([], null)
        setCurrentCalendarId(null)
      }
    }
  }

  const handleExportPNG = async () => {
    setIsExporting(true)
    try {
      await exportService.exportAsPNG('timeline-container', 'calendar_' + new Date().toISOString().slice(0, 19))
    } catch (error) {
      alert('Export failed: ' + error.message)
    } finally {
      setIsExporting(false)
      setShowMenu(false)
    }
  }

  const handleExportSVG = async () => {
    setIsExporting(true)
    try {
      await exportService.exportAsSVG('timeline-container', 'calendar_' + new Date().toISOString().slice(0, 19))
    } catch (error) {
      alert('Export failed: ' + error.message)
    } finally {
      setIsExporting(false)
      setShowMenu(false)
    }
  }

  const handleExportJSON = () => {
    exportService.exportAsJSON(buckets, 'calendar_backup_' + new Date().toISOString().slice(0, 19))
    setShowMenu(false)
  }

  const handleImportJSON = (event) => {
    const file = event.target.files[0]
    if (file) {
      storageService.importFromJSON(file).then(calendars => {
        loadSavedList()
        alert('Imported ' + calendars.length + ' calendars')
      }).catch(error => {
        alert('Import failed: ' + error.message)
      })
    }
    fileInputRef.current.value = ''
    setShowMenu(false)
  }
  return (
    <>
      <div style={{ position: 'relative' }}>
        <button 
          className="btn-solid" 
          onClick={() => {
            loadSavedList()
            setShowMenu(!showMenu)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          📁 Menu
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: '#ede8de',
            border: '1px solid #d0c8bc',
            borderRadius: '4px',
            minWidth: '220px',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ padding: '8px 0' }}>
              <button 
                onClick={() => setShowSaveModal(true)}
                style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#e0d8ce'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                💾 Save Current Calendar
              </button>
              
              <div style={{ borderTop: '1px solid #d0c8bc', margin: '4px 0' }} />
              
              <div style={{ padding: '4px 16px', fontSize: '10px', color: '#9a8e80' }}>SAVED CALENDARS</div>
              {savedCalendars.length === 0 ? (
                <div style={{ padding: '8px 16px', fontSize: '11px', color: '#b0a898' }}>No saved calendars</div>
              ) : (
                savedCalendars.map(cal => (
                  <div key={cal.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px' }}>
                    <span style={{ fontSize: '11px', cursor: 'pointer', flex: 1 }} onClick={() => handleLoad(cal.id)}>
                      📅 {cal.name}
                    </span>
                    <button 
                      onClick={() => handleDelete(cal.id, cal.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
              
              <div style={{ borderTop: '1px solid #d0c8bc', margin: '4px 0' }} />
              
              <div style={{ padding: '4px 16px', fontSize: '10px', color: '#9a8e80' }}>EXPORT</div>
              <button 
                onClick={handleExportPNG}
                disabled={isExporting}
                style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#e0d8ce'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                📸 Export as PNG
              </button>
              <button 
                onClick={handleExportSVG}
                disabled={isExporting}
                style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#e0d8ce'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                🎨 Export as SVG
              </button>
              <button 
                onClick={handleExportJSON}
                style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#e0d8ce'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                💾 Export as JSON (Backup)
              </button>
              
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#e0d8ce'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                📂 Import from JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportJSON}
              />
            </div>
          </div>
        )}
      </div>

      {showSaveModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ede8de',
            padding: '24px',
            borderRadius: '8px',
            width: '320px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Save Calendar</h3>
            <input
              type="text"
              placeholder="Calendar name"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              style={{ width: '100%', marginBottom: '16px', padding: '8px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn-solid" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

