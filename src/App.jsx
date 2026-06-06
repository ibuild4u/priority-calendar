// src/App.jsx
import { useState, useEffect, useRef } from 'react'
import { useCalendar } from './hooks/useCalendar'
import { SimpleAuth } from './components/SimpleAuth'
import { CalendarActions } from './components/CalendarActions'
import { storageService } from './services/fileStorageService'
import { Timeline } from './components/Timeline'
import { ThemePicker } from './components/ThemePicker'
import { BucketManager } from './components/BucketManager'
import { EventDetailsModal } from './components/EventDetailsModal'
import { EventDetails } from './components/EventDetails'
import { AddEventModal } from './components/AddEventModal'
import { THEMES } from './constants/themes'

function App() {
  const [user, setUser] = useState(null)
  const [currentCalendarId, setCurrentCalendarId] = useState(null)
  const [currentTheme, setCurrentTheme] = useState('default')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showBucketManager, setShowBucketManager] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [zoom, setZoom] = useState(1)
  const zoomIn    = () => setZoom(z => Math.min(3, parseFloat((z + 0.25).toFixed(2))))
  const zoomOut   = () => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))
  const zoomReset = () => setZoom(1)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const hasMounted = useRef(false)
  const autoSaveTimer = useRef(null)

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (!currentCalendarId || !user) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      storageService.updateCalendar(currentCalendarId, buckets)
    }, 1000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [buckets])

  const {
    buckets, selectedBucket, eventError, newBucketName, newBucketPriority,
    allEvents, conflictPreview, pendingEvent,
    setSelectedBucket, setNewBucketName, setNewBucketPriority,
    setBuckets, addBucket, removeBucket, addEventOnDate,
    editEvent, removeEvent, getAvailableSlots, getLockingEvents,
    confirmOverride, cancelOverride,
  } = useCalendar()

  useEffect(() => {
    async function restoreSession() {
      const currentUser = await storageService.getCurrentUser()
      if (currentUser) {
        const savedTheme = await storageService.getThemePreference(currentUser)
        setCurrentTheme(savedTheme)
        setUser(currentUser)
      }
    }
    restoreSession()
  }, [])

  useEffect(() => {
    if (!user) return
    async function autoLoadCalendar() {
      const calendars = await storageService.getUserCalendars(user)
      if (calendars.length === 0) return
      const latest = [...calendars].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
      setBuckets(latest.buckets)
      if (latest.buckets.length > 0) setSelectedBucket(latest.buckets[0].id)
      setCurrentCalendarId(latest.id)
    }
    autoLoadCalendar()
  }, [user])

  const handleAuthSuccess = async (username, theme) => {
    setUser(username)
    if (theme) {
      setCurrentTheme(theme)
    } else {
      const savedTheme = await storageService.getThemePreference(username)
      setCurrentTheme(savedTheme)
    }
  }

  const handleThemeChange = async (themeKey) => {
    setCurrentTheme(themeKey)
    if (user) await storageService.saveThemePreference(user, themeKey)
    setShowThemePicker(false)
  }

  const handleCalendarLoaded = (loadedBuckets, calendarId) => {
    setBuckets(loadedBuckets)
    if (loadedBuckets.length > 0) setSelectedBucket(loadedBuckets[0].id)
    setCurrentCalendarId(calendarId)
  }

  const handleLogout = async () => {
    await storageService.logout()
    setUser(null)
    setBuckets([])
    setSelectedBucket(null)
    setCurrentCalendarId(null)
  }

  if (!user) return <SimpleAuth onAuthSuccess={handleAuthSuccess} />

  const activeBucket = buckets.find(b => b.id === selectedBucket)
  const theme  = THEMES[currentTheme] || THEMES.default
  const colors = theme.colors

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Modals ───────────────────────────────────────────── */}
      {showThemePicker && (
        <ThemePicker currentTheme={currentTheme} onThemeChange={handleThemeChange} onClose={() => setShowThemePicker(false)} />
      )}

      {showBucketManager && (
        <BucketManager
          buckets={buckets} selectedBucket={selectedBucket} setSelectedBucket={setSelectedBucket}
          newBucketName={newBucketName} setNewBucketName={setNewBucketName}
          newBucketPriority={newBucketPriority} setNewBucketPriority={setNewBucketPriority}
          addBucket={addBucket} removeBucket={removeBucket}
          onClose={() => setShowBucketManager(false)} colors={colors}
        />
      )}

      {showEventDetails && (() => {
        const eventBucket = buckets.find(b => b.id === showEventDetails?.bucketId)
        return eventBucket ? (
          <EventDetailsModal
            event={showEventDetails} bucket={eventBucket}
            onClose={() => setShowEventDetails(null)}
            onEdit={editEvent}
            onDelete={() => { removeEvent(showEventDetails.bucketId, showEventDetails.id); setShowEventDetails(null) }}
            colors={colors}
          />
        ) : null
      })()}

      {showAddModal && (
        <AddEventModal
          buckets={buckets}
          onAdd={addEventOnDate}
          onClose={() => setShowAddModal(false)}
          colors={colors}
          eventError={eventError}
        />
      )}

      {/* Conflict resolution modal (shown when a priority conflict is detected) */}
      {conflictPreview && (() => {
        const conflictBucket = pendingEvent ? buckets.find(b => b.id === pendingEvent.bucketId) : activeBucket
        if (!conflictBucket) return null
        return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#ede8de', padding: '24px', borderRadius: '8px', width: '450px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom: '16px', color: '#c0392b' }}>⚠️ Priority Conflict</h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Lower priority event</strong> (P{conflictBucket.priority}: {conflictBucket.name}) conflicts with:
              </p>
              <div style={{ background: '#f5f0e8', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                {conflictPreview.conflicts?.map((c, i) => (
                  <div key={i} style={{ marginBottom: '4px', fontSize: '12px' }}>
                    • <strong style={{ color: '#c0392b' }}>{c.bucketName}</strong> (P{c.priority}): {c.time}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => confirmOverride('split')}  style={{ padding: '10px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }}>✂️ Split &amp; Fit — adjust around conflicts</button>
              <button onClick={() => confirmOverride('clip')}   style={{ padding: '10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }}>⏰ Clip Event — truncate to fit</button>
              <button onClick={() => confirmOverride('override')} style={{ padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }}>🔓 Override — remove conflicting events</button>
              <button onClick={cancelOverride} style={{ padding: '10px', background: '#7a6e62', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>❌ Cancel</button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── Global styles ─────────────────────────────────────── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.timeRulerBg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.buttonSecondary}; border-radius: 4px; }
        input, select { font-family: 'IBM Plex Mono', monospace; background: ${colors.background}; border: 1px solid ${colors.sidebarBorder}; padding: 10px 12px; font-size: 14px; border-radius: 8px; outline: none; }
        input:focus, select:focus { border-color: ${colors.buttonPrimary}; }
        button { font-family: 'IBM Plex Mono', monospace; cursor: pointer; }
        .btn-ghost { background: transparent; border: 1px solid ${colors.buttonSecondary}; color: ${colors.buttonSecondary}; padding: 8px 14px; font-size: 13px; border-radius: 8px; transition: all 0.15s; }
        .btn-solid { background: ${colors.buttonPrimary}; border: 1px solid ${colors.buttonPrimary}; color: ${colors.headerText}; padding: 10px 16px; font-size: 13px; border-radius: 8px; transition: background 0.15s; }
        .btn-solid:hover { background: ${colors.buttonPrimaryHover}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.18s ease forwards; }
        .locked-overlay { background: repeating-linear-gradient(45deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 3px, transparent 3px, transparent 8px); }
        @media (max-width: 768px) {
          input, select { font-size: 16px !important; padding: 12px !important; }
          .btn-ghost, .btn-solid { padding: 10px 16px !important; font-size: 14px !important; }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background: colors.headerBg, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 16 : 20, color: colors.headerText, fontWeight: 900 }}>Priority Lock</div>
          <div style={{ fontSize: isMobile ? 8 : 9, color: colors.buttonSecondary, marginTop: 1 }}>{user}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setShowBucketManager(true)} style={{ fontSize: isMobile ? 11 : 12, padding: '6px 10px' }}>📦 Buckets</button>
          <button className="btn-ghost" onClick={() => setShowThemePicker(true)}   style={{ fontSize: isMobile ? 11 : 12, padding: '6px 10px' }}>🎨</button>
          <CalendarActions buckets={buckets} onCalendarLoaded={handleCalendarLoaded} currentCalendarId={currentCalendarId} setCurrentCalendarId={setCurrentCalendarId} />
          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: `1px solid ${colors.buttonSecondary}`, borderRadius: 8, padding: '2px 4px' }}>
            <button onClick={zoomOut}   style={{ background: 'none', border: 'none', color: colors.buttonSecondary, fontSize: 16, lineHeight: 1, cursor: 'pointer', padding: '0 4px' }} title="Zoom out">−</button>
            <span onClick={zoomReset} title="Reset zoom" style={{ fontSize: 10, color: colors.buttonSecondary, minWidth: 34, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={zoomIn}    style={{ background: 'none', border: 'none', color: colors.buttonSecondary, fontSize: 16, lineHeight: 1, cursor: 'pointer', padding: '0 4px' }} title="Zoom in">+</button>
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={{ color: colors.errorText, fontSize: isMobile ? 11 : 12, padding: '6px 10px' }}>
            {isMobile ? '🚪' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '16px', gap: '12px' }}>
        <div style={{ flex: 1, overflow: 'auto', borderRadius: '8px' }}>
          <Timeline
            buckets={buckets}
            allEvents={allEvents}
            selectedBucket={selectedBucket}
            activeBucket={activeBucket}
            getLockingEvents={getLockingEvents}
            getAvailableSlots={getAvailableSlots}
            removeEvent={removeEvent}
            editEvent={editEvent}
            onEventClick={ev => setShowEventDetails(ev)}
            zoom={zoom}
          />
        </div>
        {!isMobile && activeBucket && (
          <EventDetails activeBucket={activeBucket} removeEvent={removeEvent} />
        )}
      </div>

      {/* ── Floating add button ───────────────────────────────── */}
      <button
        onClick={() => setShowAddModal(true)}
        title="Add event"
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 56, height: 56, borderRadius: '50%',
          background: colors.buttonPrimary,
          border: 'none', color: colors.headerText,
          fontSize: 28, lineHeight: 1,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
          transition: 'transform 0.15s, background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        +
      </button>
    </div>
  )
}

export default App
