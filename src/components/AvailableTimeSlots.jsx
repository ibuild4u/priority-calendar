import React from 'react'
import { useState, useEffect } from 'react'
import { formatTime, formatDuration } from '../utils/helpers'

export function AvailableTimeSlots({ lockedEvents, existingEvents, durationMins, onSelectSlot }) {
  const [availableSlots, setAvailableSlots] = useState([])
  const [hoveredSlot, setHoveredSlot] = useState(null)

  useEffect(() => {
    const calculateAvailableSlots = () => {
      const blockedTimes = []
      
      // Add locked events from higher priority buckets
      if (lockedEvents && lockedEvents.length > 0) {
        lockedEvents.forEach(lock => {
          if (lock.startMin !== undefined && lock.durationMins) {
            blockedTimes.push({
              start: lock.startMin,
              end: lock.startMin + lock.durationMins,
              type: 'locked'
            })
          }
        })
      }
      
      // Add existing events from current bucket
      if (existingEvents && existingEvents.length > 0) {
        existingEvents.forEach(ev => {
          if (ev.startMin !== undefined && ev.durationMins) {
            blockedTimes.push({
              start: ev.startMin,
              end: ev.startMin + ev.durationMins,
              type: 'existing'
            })
          }
        })
      }
      
      if (blockedTimes.length === 0) {
        const fullDaySlot = {
          start: 0,
          end: 1440,
          duration: 1440,
          canFitEvent: 1440 >= (durationMins || 30)
        }
        setAvailableSlots([fullDaySlot])
        return
      }
      
      blockedTimes.sort((a, b) => a.start - b.start)
      
      const mergedBlocks = []
      for (const block of blockedTimes) {
        if (mergedBlocks.length === 0) {
          mergedBlocks.push({ ...block })
        } else {
          const last = mergedBlocks[mergedBlocks.length - 1]
          if (block.start <= last.end) {
            last.end = Math.max(last.end, block.end)
          } else {
            mergedBlocks.push({ ...block })
          }
        }
      }
      
      const slots = []
      let currentTime = 0
      const dayEnd = 24 * 60
      
      for (const block of mergedBlocks) {
        if (currentTime < block.start) {
          const slotDuration = block.start - currentTime
          if (slotDuration >= 15) {
            slots.push({
              start: currentTime,
              end: block.start,
              duration: slotDuration,
              canFitEvent: slotDuration >= (durationMins || 30)
            })
          }
        }
        currentTime = Math.max(currentTime, block.end)
      }
      
      if (currentTime < dayEnd) {
        const slotDuration = dayEnd - currentTime
        if (slotDuration >= 15) {
          slots.push({
            start: currentTime,
            end: dayEnd,
            duration: slotDuration,
            canFitEvent: slotDuration >= (durationMins || 30)
          })
        }
      }
      
      setAvailableSlots(slots)
    }
    
    calculateAvailableSlots()
  }, [lockedEvents, existingEvents, durationMins])
  
  if (availableSlots.length === 0) {
    return null
  }
  
  return (
    <>
      {availableSlots.map(slot => (
        <div
          key={slot.start}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: slot.start * 1.9,
            height: slot.duration * 1.9,
            background: hoveredSlot === slot.start ? 'rgba(46, 204, 113, 0.4)' : (slot.canFitEvent ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.15)'),
            border: hoveredSlot === slot.start ? '2px solid #27ae60' : (slot.canFitEvent ? '1px dashed #27ae60' : '1px dotted #f1c40f'),
            borderRadius: '4px',
            cursor: slot.canFitEvent ? 'pointer' : 'default',
            transition: 'all 0.2s',
            zIndex: 2,
            pointerEvents: slot.canFitEvent ? 'auto' : 'none'
          }}
          onMouseEnter={() => setHoveredSlot(slot.start)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={() => {
            if (slot.canFitEvent && onSelectSlot) {
              onSelectSlot(slot.start, slot.end)
            }
          }}
        >
          <div style={{
            position: 'absolute',
            top: 2,
            left: 4,
            fontSize: 7,
            color: slot.canFitEvent ? '#27ae60' : '#f39c12',
            background: 'rgba(255,255,255,0.85)',
            padding: '0 3px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            fontFamily: 'monospace'
          }}>
            {formatTime(slot.start)}-{formatTime(slot.end)} ({formatDuration(slot.duration)})
            {!slot.canFitEvent && ' too small'}
          </div>
          
          {hoveredSlot === slot.start && slot.canFitEvent && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '9px',
              color: '#27ae60',
              background: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              Click to add event here
            </div>
          )}
        </div>
      ))}
    </>
  )
}

