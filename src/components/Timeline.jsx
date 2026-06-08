import React from 'react'
import { PX_PER_MIN_HOR, TIMELINE_WIDTH } from '../constants/palette'
import { formatTime, formatDateLabel, getDatesInRange, getEventDate } from '../utils/helpers'
import { EventBlock } from './EventBlock'

export function Timeline({ buckets, allEvents, selectedBucket, activeBucket, getLockingEvents, getAvailableSlots, removeEvent, editEvent, onEventClick, zoom = 1 }) {
  const pxPerMin   = PX_PER_MIN_HOR * zoom
  const totalWidth = TIMELINE_WIDTH * zoom
  const rowHeight  = 70 * zoom
  const eventH     = 62 * zoom
  const eventTop   = 4 * zoom
  const labelWidth = 96  // wide enough for "Wed Jun 30"

  const getLeftPos = (mins) => mins * pxPerMin

  const hourMarkers = []
  for (let h = 0; h <= 24; h++) {
    if (h % 2 === 0 || h === 1 || h === 23) hourMarkers.push(h)
  }

  // Build date range from all events (with migration fallback via allEvents which already has date)
  const eventDates = allEvents.map(e => e.date).filter(Boolean)

  if (buckets.length === 0 || eventDates.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 15 }}>
        <div style={{ fontSize: 14, color: '#b0a898', textAlign: 'center' }}>
          {buckets.length === 0 ? 'No buckets created yet' : 'No events yet'}
        </div>
        <div style={{ fontSize: 11, color: '#9a8e80', textAlign: 'center' }}>
          {buckets.length === 0
            ? 'Click "+ NEW BUCKET" in Buckets to create your first priority group'
            : 'Tap the + button to add your first event'}
        </div>
      </div>
    )
  }

  const sortedDates = [...new Set(eventDates)].sort()
  const minDate = sortedDates[0]
  const maxDate = sortedDates[sortedDates.length - 1]
  const dateRows = getDatesInRange(minDate, maxDate)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <div style={{ minWidth: totalWidth + labelWidth }}>

        {/* Time ruler */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #d0c8bc', background: '#e8e2d6',
          position: 'sticky', top: 0, zIndex: 20, minHeight: 32,
        }}>
          <div style={{
            width: labelWidth, flexShrink: 0, borderRight: '1px solid #d0c8bc',
            paddingLeft: 10, fontSize: 9, fontWeight: 500,
            display: 'flex', alignItems: 'center',
            position: 'sticky', left: 0, background: '#e8e2d6', zIndex: 21,
          }}>
            DATE
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: totalWidth, height: 32 }}>
            {hourMarkers.map(h => (
              <div key={h} style={{ position: 'absolute', left: getLeftPos(h * 60), top: 6, transform: 'translateX(-50%)' }}>
                <span style={{ fontSize: 9, color: '#7e6e5a', background: '#e8e2d6', padding: '0 4px' }}>
                  {h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* One row per date in range */}
        {dateRows.map((date) => {
          const dayEvents      = allEvents.filter(e => e.date === date)
          const lockingEvents  = activeBucket ? getLockingEvents(activeBucket.id).filter(e => getEventDate(e) === date) : []
          const availableSlots = activeBucket ? getAvailableSlots(activeBucket.id, date) : []

          const positionedEvents = [...dayEvents]
            .sort((a, b) => a.startMin - b.startMin)
            .map(ev => ({
              ...ev,
              leftPos: getLeftPos(ev.startMin),
              topPos:  eventTop,
              height:  eventH,
              width:   ev.durationMins * pxPerMin,
            }))

          const isToday = date === today
          return (
            <div key={date} style={{ display: 'flex', borderBottom: '1px solid #eae2d4', minHeight: rowHeight, background: isToday ? '#fdf6e3' : '#fefcf8', position: 'relative' }}>

              {/* Date label */}
              <div style={{
                width: labelWidth, flexShrink: 0, borderRight: '1px solid #d8cfc0',
                background: isToday ? '#f5ecd0' : '#ede7dd', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                position: 'sticky', left: 0, zIndex: 10, backgroundColor: isToday ? '#f5ecd0' : '#ede7dd',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.3, padding: '0 4px' }}>
                  {formatDateLabel(date)}
                </span>
                {isToday && (
                  <span style={{ fontSize: 7, fontWeight: 700, color: '#b8830a', background: '#fde68a', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.05em' }}>TODAY</span>
                )}
                <span style={{ fontSize: 9, color: '#b0a18e' }}>{dayEvents.length} events</span>
              </div>

              {/* Event track */}
              <div style={{ position: 'relative', flex: 1, minWidth: totalWidth, height: rowHeight }}>

                {availableSlots.map((slot, idx) => (
                  <div key={`av-${idx}`} style={{
                    position: 'absolute', left: getLeftPos(slot.start), width: slot.duration * pxPerMin,
                    top: eventTop, bottom: eventTop,
                    background: '#e8f5e9', borderLeft: '2px solid #81c784',
                    borderRadius: 2, pointerEvents: 'none', zIndex: 1, opacity: 0.4,
                  }}>
                    <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 7, color: '#4caf50', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {formatTime(slot.start)}-{formatTime(slot.end)}
                    </div>
                  </div>
                ))}

                {lockingEvents.map((lock, idx) => (
                  <div key={`lock-${idx}`} style={{
                    position: 'absolute', left: getLeftPos(lock.startMin), width: lock.durationMins * pxPerMin,
                    top: eventTop, bottom: eventTop,
                    background: lock.color.bg + '40', borderLeft: '3px solid ' + lock.color.bg,
                    borderRadius: 2, pointerEvents: 'none', zIndex: 3,
                  }}>
                    <div className="locked-overlay" style={{ width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', left: 4, top: 2, fontSize: 7, color: lock.color.bg, fontWeight: 500, background: 'rgba(255,255,240,0.8)', padding: '0 3px', borderRadius: 2 }}>
                      Locked: {lock.bucketName}
                    </div>
                  </div>
                ))}

                {positionedEvents.map(ev => {
                  const isActive   = ev.bucketId === selectedBucket
                  const eventColor = buckets.find(b => b.id === ev.bucketId)?.color || ev.color
                  return (
                    <EventBlock
                      key={ev.id}
                      event={ev}
                      bucketColor={eventColor}
                      onRemove={removeEvent}
                      onEdit={editEvent}
                      isActive={isActive}
                      onClick={() => onEventClick && onEventClick(ev)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
