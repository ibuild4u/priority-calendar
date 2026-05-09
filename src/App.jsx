// src/App.jsx - Mobile responsive version
import { useState, useEffect } from 'react'
import { useCalendar } from './hooks/useCalendar'
import { SimpleAuth } from './components/SimpleAuth'
import { CalendarActions } from './components/CalendarActions'
import { storageService } from './services/localStorageService'
import { parseTime, parseDuration } from './utils/helpers'
import { Sidebar } from './components/Sidebar'
import { EventForm } from './components/EventForm'
import { Timeline } from './components/Timeline'
import { EventDetails } from './components/EventDetails'
import { ThemePicker } from './components/ThemePicker'
import { MobileMenu } from './components/MobileMenu'
import { THEMES } from './constants/themes'

function App() {
  const [user, setUser] = useState(null)
  const [currentCalendarId, setCurrentCalendarId] = useState(null)
  const [currentTheme, setCurrentTheme] = useState('default')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const {
    buckets, selectedBucket, panel, addEventDays, addEventStartTime, addEventEndTime,
    addEventDuration, addEventLabel, eventError, showDaySelector, newBucketName, newBucketPriority,
    allEvents, setSelectedBucket, setPanel, setAddEventStartTime, setAddEventEndTime,
    setAddEventDuration, setAddEventLabel, setEventError, setShowDaySelector, setNewBucketName, setNewBucketPriority,
    setBuckets, addBucket, removeBucket, addEventToDays, editEvent, removeEvent, toggleDaySelection,
    getAvailableSlots, getLockingEvents
  } = useCalendar()

  useEffect(() => {
    const currentUser = storageService.getCurrentUser()
    if (currentUser) {
      const savedTheme = storageService.getThemePreference(currentUser)
      setCurrentTheme(savedTheme)
      setUser(currentUser)
    }
  }, [])

  const handleAuthSuccess = (username, theme) => {
    setUser(username)
    if (theme) {
      setCurrentTheme(theme)
    } else {
      const savedTheme = storageService.getThemePreference(username)
      setCurrentTheme(savedTheme)
    }
  }

  const handleThemeChange = (themeKey) => {
    setCurrentTheme(themeKey)
    if (user) {
      storageService.saveThemePreference(user, themeKey)
    }
    setShowThemePicker(false)
  }

  const handleCalendarLoaded = (loadedBuckets, calendarId) => {
    setBuckets(loadedBuckets)
    if (loadedBuckets.length > 0) {
      setSelectedBucket(loadedBuckets[0].id)
    }
    setCurrentCalendarId(calendarId)
  }

  const handleLogout = () => {
    storageService.logout()
    setUser(null)
    setBuckets([])
    setSelectedBucket(null)
    setCurrentCalendarId(null)
  }

  const handleAddEvent = () => {
    if (!selectedBucket) {
      setEventError("Please select a bucket first")
      return
    }
    
    if (addEventDays.length === 0) {
      setEventError("Please select at least one day")
      return
    }
    
    if (!addEventStartTime) {
      setEventError("Please enter a start time")
      return
    }
    
    const startMin = parseTime(addEventStartTime)
    if (startMin === null) {
      setEventError("Invalid start time format")
      return
    }
    
    let durationMins = null
    if (addEventDuration) {
      durationMins = parseDuration(addEventDuration)
    } else if (addEventEndTime) {
      const endMin = parseTime(addEventEndTime)
      if (endMin !== null && endMin > startMin) {
        durationMins = endMin - startMin
      }
    }
    
    if (!durationMins || durationMins < 15) {
      setEventError("Please enter a valid duration (minimum 15 minutes)")
      return
    }
    
    const success = addEventToDays(addEventDays, startMin, durationMins, addEventLabel)
    if (success) {
      setAddEventStartTime("")
      setAddEventEndTime("")
      setAddEventDuration("")
      setAddEventLabel("")
      setAddEventDays([])
      setShowDaySelector(false)
      setEventError("")
    }
  }

  if (!user) {
    return <SimpleAuth onAuthSuccess={handleAuthSuccess} />
  }

  const activeBucket = buckets.find(b => b.id === selectedBucket)
  const theme = THEMES[currentTheme] || THEMES.default
  const colors = theme.colors

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: colors.background, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {showThemePicker && (
        <ThemePicker
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          onClose={() => setShowThemePicker(false)}
        />
      )}
      
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.timeRulerBg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.buttonSecondary}; border-radius: 4px; }
        input, select { font-family: 'IBM Plex Mono', monospace; background: ${colors.background}; border: 1px solid ${colors.sidebarBorder}; padding: 10px 12px; font-size: 14px; border-radius: 8px; outline: none; }
        input:focus, select:focus { border-color: ${colors.buttonPrimary}; background: ${colors.background}; }
        button { font-family: 'IBM Plex Mono', monospace; cursor: pointer; }
        .btn-ghost { background: transparent; border: 1px solid ${colors.buttonSecondary}; color: ${colors.buttonSecondary}; padding: 8px 14px; font-size: 13px; border-radius: 8px; transition: all 0.15s; }
        .btn-ghost:hover { background: ${colors.sidebarBg}; color: ${colors.buttonPrimary}; border-color: ${colors.buttonPrimary}; }
        .btn-solid { background: ${colors.buttonPrimary}; border: 1px solid ${colors.buttonPrimary}; color: ${colors.headerText}; padding: 10px 16px; font-size: 13px; border-radius: 8px; transition: background 0.15s; }
        .btn-solid:hover { background: ${colors.buttonPrimaryHover}; }
        .bucket-row:hover { background: ${colors.sidebarBg}; }
        .bucket-row.active { background: ${colors.timeRulerBg}; }
        .day-chip { transition: all 0.1s; padding: 8px 16px !important; font-size: 13px !important; }
        .day-chip.selected { background: ${colors.buttonPrimary}; border-color: ${colors.buttonPrimary}; color: white; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.18s ease forwards; }
        .locked-overlay { background: repeating-linear-gradient(45deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 3px, transparent 3px, transparent 8px); }
        
        @media (max-width: 768px) {
          input, select { font-size: 16px !important; padding: 12px !important; }
          .btn-ghost, .btn-solid { padding: 10px 16px !important; font-size: 14px !important; }
          .bucket-row div { font-size: 14px !important; }
        }
      `}</style>

      <div style={{ background: colors.headerBg, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <MobileMenu button={<button className="btn-ghost" style={{ padding: '8px 12px', fontSize: '18px' }}>☰</button>}>
              <Sidebar 
                buckets={buckets}
                selectedBucket={selectedBucket}
                setSelectedBucket={setSelectedBucket}
                panel={panel}
                setPanel={setPanel}
                newBucketName={newBucketName}
                setNewBucketName={setNewBucketName}
                newBucketPriority={newBucketPriority}
                setNewBucketPriority={setNewBucketPriority}
                addBucket={addBucket}
                removeBucket={removeBucket}
                isMobile={true}
              />
            </MobileMenu>
          )}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 16 : 20, color: colors.headerText, fontWeight: 900 }}>Priority Lock</div>
            <div style={{ fontSize: isMobile ? 8 : 9, color: colors.buttonSecondary, marginTop: 1 }}>Welcome, {user}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setShowThemePicker(true)} style={{ fontSize: isMobile ? 11 : 12, padding: '6px 10px' }}>
            🎨
          </button>
          <CalendarActions 
            buckets={buckets}
            onCalendarLoaded={handleCalendarLoaded}
            currentCalendarId={currentCalendarId}
            setCurrentCalendarId={setCurrentCalendarId}
          />
          <button className="btn-ghost" onClick={handleLogout} style={{ color: colors.errorText, fontSize: isMobile ? 11 : 12, padding: '6px 10px' }}>
            {isMobile ? '🚪' : 'Sign Out'}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: isMobile ? "column" : "row" }}>
        {!isMobile && (
          <Sidebar 
            buckets={buckets}
            selectedBucket={selectedBucket}
            setSelectedBucket={setSelectedBucket}
            panel={panel}
            setPanel={setPanel}
            newBucketName={newBucketName}
            setNewBucketName={setNewBucketName}
            newBucketPriority={newBucketPriority}
            setNewBucketPriority={setNewBucketPriority}
            addBucket={addBucket}
            removeBucket={removeBucket}
            isMobile={false}
          />
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <EventForm 
            activeBucket={activeBucket}
            addEventDays={addEventDays}
            toggleDaySelection={toggleDaySelection}
            showDaySelector={showDaySelector}
            setShowDaySelector={setShowDaySelector}
            addEventStartTime={addEventStartTime}
            setAddEventStartTime={setAddEventStartTime}
            addEventEndTime={addEventEndTime}
            setAddEventEndTime={setAddEventEndTime}
            addEventDuration={addEventDuration}
            setAddEventDuration={setAddEventDuration}
            addEventLabel={addEventLabel}
            setAddEventLabel={setAddEventLabel}
            addEvent={handleAddEvent}
            externalEventError={eventError}
            conflictPreview={null}
            confirmOverride={() => {}}
            cancelOverride={() => {}}
          />

          <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
            <Timeline 
              buckets={buckets}
              allEvents={allEvents}
              selectedBucket={selectedBucket}
              activeBucket={activeBucket}
              getLockingEvents={getLockingEvents}
              getAvailableSlots={getAvailableSlots}
              removeEvent={removeEvent}
              editEvent={editEvent}
            />
          </div>
        </div>

        {!isMobile && (
          <EventDetails 
            activeBucket={activeBucket}
            removeEvent={removeEvent}
          />
        )}
      </div>
      
      {isMobile && showMobileDetails && activeBucket && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: colors.sidebarBg,
          borderTop: `1px solid ${colors.sidebarBorder}`,
          maxHeight: '50vh',
          overflowY: 'auto',
          zIndex: 100,
          borderRadius: '12px 12px 0 0',
          animation: 'fadeUp 0.3s ease'
        }}>
          <div style={{ padding: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowMobileDetails(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
          </div>
          <EventDetails activeBucket={activeBucket} removeEvent={removeEvent} />
        </div>
      )}
      
      {isMobile && activeBucket && (
        <button
          onClick={() => setShowMobileDetails(!showMobileDetails)}
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            background: colors.buttonPrimary,
            color: colors.headerText,
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          📋
        </button>
      )}
    </div>
  )
}

export default App
