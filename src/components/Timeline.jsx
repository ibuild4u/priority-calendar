import React from 'react'
import { DAYS, PX_PER_MIN_HOR, TIMELINE_WIDTH } from '../constants/palette';
import { formatTime } from '../utils/helpers';
import { EventBlock } from './EventBlock';

export function Timeline({ buckets, allEvents, selectedBucket, activeBucket, getLockingEvents, getAvailableSlots, removeEvent, editEvent, onEventClick }) {
  const hourMarkers = [];
  for (let h = 0; h <= 24; h++) {
    if (h % 2 === 0 || h === 1 || h === 23) hourMarkers.push(h);
  }
  
  const getLeftPos = (mins) => mins * 1.9;

  if (buckets.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 15 }}>
        <div style={{ fontSize: 14, color: "#b0a898", textAlign: "center" }}>No buckets created yet</div>
        <div style={{ fontSize: 11, color: "#9a8e80", textAlign: "center" }}>Click "+ NEW BUCKET" to create your first priority group</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <div style={{ minWidth: TIMELINE_WIDTH + 80 }}>
        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #d0c8bc", 
          background: "#e8e2d6", 
          position: "sticky", 
          top: 0, 
          zIndex: 20, 
          minHeight: 32 
        }}>
          <div style={{ 
            width: 80, 
            flexShrink: 0, 
            borderRight: "1px solid #d0c8bc", 
            paddingLeft: 12, 
            fontSize: 9, 
            fontWeight: 500, 
            display: "flex", 
            alignItems: "center",
            position: "sticky",
            left: 0,
            background: "#e8e2d6",
            zIndex: 21
          }}>
            DAY
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: TIMELINE_WIDTH, height: 32 }}>
            {hourMarkers.map(h => (
              <div key={h} style={{ position: "absolute", left: getLeftPos(h * 60), top: 6, transform: "translateX(-50%)" }}>
                <span style={{ fontSize: 9, color: "#7e6e5a", background: "#e8e2d6", padding: "0 4px" }}>
                  {h === 0 ? "12a" : h < 12 ? h + "a" : h === 12 ? "12p" : (h-12) + "p"}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {DAYS.map((day, dayIdx) => {
          const dayEvents = allEvents.filter(e => e.dayIdx === dayIdx);
          const lockingEvents = activeBucket ? getLockingEvents(activeBucket.id).filter(e => e.dayIdx === dayIdx) : [];
          const availableSlots = activeBucket ? getAvailableSlots(activeBucket.id, dayIdx) : [];
          
          const sortedEvents = [...dayEvents].sort((a, b) => a.startMin - b.startMin);
          
          const positionedEvents = sortedEvents.map(ev => ({
            ...ev,
            leftPos: getLeftPos(ev.startMin),
            topPos: 4,
            height: 62,
            width: ev.durationMins * 1.9
          }))
          
          return (
            <div key={day} style={{ display: "flex", borderBottom: "1px solid #eae2d4", minHeight: 70, background: "#fefcf8", position: 'relative' }}>
              <div style={{ 
                width: 80, 
                flexShrink: 0, 
                borderRight: "1px solid #d8cfc0", 
                background: "#ede7dd", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: 3,
                position: "sticky",
                left: 0,
                zIndex: 10,
                backgroundColor: "#ede7dd"
              }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{day}</span>
                <span style={{ fontSize: 9, color: "#b0a18e" }}>{dayEvents.length} events</span>
              </div>
              
              <div style={{ position: "relative", flex: 1, minWidth: TIMELINE_WIDTH, height: 70 }}>
                {availableSlots.map((slot, idx) => (
                  <div
                    key={`available-${idx}`}
                    style={{
                      position: "absolute",
                      left: getLeftPos(slot.start),
                      width: slot.duration * 1.9,
                      top: 4,
                      bottom: 4,
                      background: '#e8f5e9',
                      borderLeft: '2px solid #81c784',
                      borderRadius: '2px',
                      pointerEvents: 'none',
                      zIndex: 1,
                      opacity: 0.4
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 7,
                      color: '#4caf50',
                      whiteSpace: 'nowrap',
                      fontWeight: 500
                    }}>
                      {formatTime(slot.start)}-{formatTime(slot.end)}
                    </div>
                  </div>
                ))}
                
                {lockingEvents.map((lock, idx) => (
                  <div key={"lock-" + idx} style={{
                    position: "absolute",
                    left: getLeftPos(lock.startMin),
                    width: lock.durationMins * 1.9,
                    top: 4, bottom: 4,
                    background: lock.color.bg + "40",
                    borderLeft: "3px solid " + lock.color.bg,
                    borderRadius: 2,
                    pointerEvents: "none",
                    zIndex: 3,
                  }}>
                    <div className="locked-overlay" style={{ width: "100%", height: "100%" }} />
                    <div style={{ position: "absolute", left: 4, top: 2, fontSize: 7, color: lock.color.bg, fontWeight: 500, background: "rgba(255,255,240,0.8)", padding: "0 3px", borderRadius: 2 }}>
                      Locked: {lock.bucketName}
                    </div>
                  </div>
                ))}
                
                {positionedEvents.map(ev => {
                  const isActive = ev.bucketId === selectedBucket;
                  const eventColor = buckets.find(b => b.id === ev.bucketId)?.color || ev.color;
                  
                  return (
                    <EventBlock
                      key={ev.id}
                      event={{
                        ...ev,
                        leftPos: getLeftPos(ev.startMin),
                        topPos: 4,
                        height: 62,
                        width: ev.durationMins * 1.9
                      }}
                      bucketColor={eventColor}
                      onRemove={removeEvent}
                      onEdit={editEvent}
                      isActive={isActive}
                      onClick={() => onEventClick && onEventClick(ev)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
