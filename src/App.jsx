import React from 'react'

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
import { THEMES } from './constants/themes'

function App() {
  const [user, setUser] = useState(null)
  const [currentCalendarId, setCurrentCalendarId] = useState(null)
  const [currentTheme, setCurrentTheme] = useState('default')
  const [showThemePicker, setShowThemePicker] = useState(false)

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
        input, select { font-family: 'IBM Plex Mono', monospace; background: ${colors.background}; border: 1px solid ${colors.sidebarBorder}; padding: 7px 10px; font-size: 12px; border-radius: 2px; outline: none; }
        input:focus, select:focus { border-color: ${colors.buttonPrimary}; background: ${colors.background}; }
        button { font-family: 'IBM Plex Mono', monospace; cursor: pointer; }
        .btn-ghost { background: transparent; border: 1px solid ${colors.buttonSecondary}; color: ${colors.buttonSecondary}; padding: 5px 12px; font-size: 11px; border-radius: 2px; transition: all 0.15s; }
        .btn-ghost:hover { background: ${colors.sidebarBg}; color: ${colors.buttonPrimary}; border-color: ${colors.buttonPrimary}; }
        .btn-solid { background: ${colors.buttonPrimary}; border: 1px solid ${colors.buttonPrimary}; color: ${colors.headerText}; padding: 6px 14px; font-size: 11px; border-radius: 2px; transition: background 0.15s; }
        .btn-solid:hover { background: ${colors.buttonPrimaryHover}; }
        .bucket-row:hover { background: ${colors.sidebarBg}; }
        .bucket-row.active { background: ${colors.timeRulerBg}; }
        .day-chip { transition: all 0.1s; }
        .day-chip.selected { background: ${colors.buttonPrimary}; border-color: ${colors.buttonPrimary}; color: white; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.18s ease forwards; }
        .locked-overlay { background: repeating-linear-gradient(45deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 3px, transparent 3px, transparent 8px); }
      `}</style>

      <div style={{ background: colors.headerBg, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: colors.headerText, fontWeight: 900 }}>Priority Lock</div>
          <div style={{ fontSize: 9, color: colors.buttonSecondary, marginTop: 1 }}>
            Welcome, {user}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="btn-ghost" 
            onClick={() => setShowThemePicker(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🎨 {theme.name}
          </button>
          <CalendarActions 
            buckets={buckets}
            onCalendarLoaded={handleCalendarLoaded}
            currentCalendarId={currentCalendarId}
            setCurrentCalendarId={setCurrentCalendarId}
          />
          <button className="btn-ghost" onClick={handleLogout} style={{ color: colors.errorText }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
        />

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

        <EventDetails 
          activeBucket={activeBucket}
          removeEvent={removeEvent}
        />
      </div>
    </div>
  )
}

export default App

