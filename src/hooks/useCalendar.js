import { useState, useMemo } from 'react';
import { uid, overlaps, parseTime, formatTime, parseDuration } from '../utils/helpers';
import { PALETTE, DAYS } from '../constants/palette';

export function useCalendar() {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [panel, setPanel] = useState(null);
  const [addEventDays, setAddEventDays] = useState([]);
  const [addEventStartTime, setAddEventStartTime] = useState("");
  const [addEventEndTime, setAddEventEndTime] = useState("");
  const [addEventDuration, setAddEventDuration] = useState("");
  const [addEventLabel, setAddEventLabel] = useState("");
  const [eventError, setEventError] = useState("");
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketPriority, setNewBucketPriority] = useState("");

  const allEvents = useMemo(() => {
    const list = [];
    buckets.forEach((b) => {
      b.events.forEach(ev => {
        list.push({ 
          ...ev, 
          bucketId: b.id, 
          bucketName: b.name, 
          bucketPriority: b.priority,
          color: b.color 
        });
      });
    });
    return list.sort((a, b) => a.bucketPriority - b.bucketPriority);
  }, [buckets]);

  // Calculate available time slots for a specific day and bucket
  function getAvailableSlots(bucketId, dayIdx) {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return [{ start: 0, end: 24 * 60, duration: 24 * 60 }];
    
    // Get all events for this day from this bucket
    const dayEvents = bucket.events.filter(e => e.dayIdx === dayIdx);
    
    if (dayEvents.length === 0) {
      return [{ start: 0, end: 24 * 60, duration: 24 * 60 }];
    }
    
    // Sort events by start time
    const sortedEvents = [...dayEvents].sort((a, b) => a.startMin - b.startMin);
    
    const availableSlots = [];
    let currentTime = 0;
    const dayEnd = 24 * 60;
    
    for (const event of sortedEvents) {
      const eventStart = event.startMin;
      const eventEnd = event.startMin + event.durationMins;
      
      if (currentTime < eventStart) {
        availableSlots.push({
          start: currentTime,
          end: eventStart,
          duration: eventStart - currentTime
        });
      }
      currentTime = Math.max(currentTime, eventEnd);
    }
    
    if (currentTime < dayEnd) {
      availableSlots.push({
        start: currentTime,
        end: dayEnd,
        duration: dayEnd - currentTime
      });
    }
    
    return availableSlots.filter(slot => slot.duration >= 15); // Only show slots >= 15 minutes
  }

  function getLockingEvents(bucketId) {
    const currentBucket = buckets.find(b => b.id === bucketId);
    if (!currentBucket) return [];
    const lockingEvents = [];
    buckets.forEach(b => {
      if (b.priority < currentBucket.priority) {
        b.events.forEach(ev => {
          lockingEvents.push({ 
            ...ev, 
            bucketName: b.name, 
            bucketPriority: b.priority,
            color: b.color 
          });
        });
      }
    });
    return lockingEvents;
  }

  function findConflicts(bucketId, dayIdx, startMin, endMin, excludeEventId = null) {
    const conflicts = [];
    const lockingEvents = getLockingEvents(bucketId);
    const currentBucket = buckets.find(b => b.id === bucketId);
    
    for (const lock of lockingEvents) {
      if (lock.dayIdx !== dayIdx) continue;
      const lockEnd = lock.startMin + lock.durationMins;
      if (overlaps({ startMin, endMin }, { startMin: lock.startMin, endMin: lockEnd })) {
        conflicts.push({
          eventName: lock.label,
          bucketName: lock.bucketName,
          priority: lock.bucketPriority,
          time: formatTime(lock.startMin) + '-' + formatTime(lockEnd)
        });
      }
    }
    
    if (currentBucket) {
      for (const ev of currentBucket.events) {
        if (excludeEventId && ev.id === excludeEventId) continue;
        if (ev.dayIdx !== dayIdx) continue;
        const evEnd = ev.startMin + ev.durationMins;
        if (overlaps({ startMin, endMin }, { startMin: ev.startMin, endMin: evEnd })) {
          conflicts.push({
            eventName: ev.label,
            bucketName: currentBucket.name,
            priority: currentBucket.priority,
            time: formatTime(ev.startMin) + '-' + formatTime(evEnd),
            isSameBucket: true
          });
        }
      }
    }
    
    return conflicts;
  }

  function addBucket() {
    const name = newBucketName.trim();
    if (!name) {
      setEventError("Bucket name required");
      return;
    }
    const priority = parseInt(newBucketPriority);
    if (isNaN(priority) || priority < 1) {
      setEventError("Priority must be a number (1 = highest)");
      return;
    }
    if (buckets.some(b => b.priority === priority)) {
      setEventError(`Priority ${priority} already exists`);
      return;
    }
    const color = PALETTE[buckets.length % PALETTE.length];
    
    const newBucket = { 
      id: uid(), 
      name, 
      priority,
      color, 
      events: []  // Start with no events
    };
    setBuckets(prev => [...prev, newBucket].sort((a, b) => a.priority - b.priority));
    setSelectedBucket(newBucket.id);
    setNewBucketName(""); 
    setNewBucketPriority("");
    setPanel(null);
    setEventError("");
  }

  function removeBucket(id) {
    const remaining = buckets.filter(b => b.id !== id);
    setBuckets(remaining);
    if (selectedBucket === id) {
      setSelectedBucket(remaining[0]?.id || null);
    }
  }

  function addEventToDays(dayIndices, startMin, durationMins, label) {
    const bucket = buckets.find(b => b.id === selectedBucket);
    if (!bucket) {
      setEventError("Please select a bucket first");
      return false;
    }
    
    const endMin = startMin + durationMins;
    
    if (startMin < 0 || endMin > 24 * 60) {
      setEventError("Event time must be between 12am and 12am");
      return false;
    }
    
    let successCount = 0;
    const errors = [];
    
    for (const dayIdx of dayIndices) {
      // Check conflicts with higher priority buckets
      const conflicts = findConflicts(selectedBucket, dayIdx, startMin, endMin);
      if (conflicts.length > 0) {
        errors.push(`${DAYS[dayIdx]}: Conflicts with ${conflicts[0].bucketName} at ${conflicts[0].time}`);
        continue;
      }
      
      // Check if overlaps with existing events in this bucket
      const existingEvent = bucket.events.find(e => 
        e.dayIdx === dayIdx && 
        overlaps({ startMin, endMin }, { startMin: e.startMin, endMin: e.startMin + e.durationMins })
      );
      
      if (existingEvent) {
        errors.push(`${DAYS[dayIdx]}: Overlaps existing event "${existingEvent.label}"`);
        continue;
      }
      
      const newEvent = {
        id: uid(),
        dayIdx,
        startMin,
        durationMins,
        label: label.trim() || bucket.name
      };
      
      setBuckets(prev => prev.map(b => {
        if (b.id !== selectedBucket) return b;
        return {
          ...b,
          events: [...b.events, newEvent]
        };
      }));
      
      successCount++;
    }
    
    if (errors.length > 0) {
      setEventError(errors.join("; "));
    } else {
      setEventError("");
    }
    
    return successCount > 0;
  }

  function editEvent(eventId, bucketId, updatedData) {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return false;
    
    const eventToEdit = bucket.events.find(e => e.id === eventId);
    if (!eventToEdit) return false;
    
    const newStartMin = updatedData.startMin;
    const newDurationMins = updatedData.durationMins;
    const newEndMin = newStartMin + newDurationMins;
    const dayIdx = eventToEdit.dayIdx;
    
    // Check conflicts with other events (excluding this one)
    const conflicts = findConflicts(bucketId, dayIdx, newStartMin, newEndMin, eventId);
    if (conflicts.length > 0) {
      setEventError(`Cannot edit: Conflicts with ${conflicts[0].bucketName} at ${conflicts[0].time}`);
      return false;
    }
    
    setBuckets(prev => prev.map(b => {
      if (b.id !== bucketId) return b;
      return {
        ...b,
        events: b.events.map(e => 
          e.id === eventId 
            ? { ...e, ...updatedData, durationMins: newDurationMins, label: updatedData.label || e.label }
            : e
        )
      };
    }));
    
    setEventError("");
    return true;
  }

  function removeEvent(bucketId, eventId) {
    setBuckets(prev => prev.map(b => 
      b.id !== bucketId ? b : {
        ...b, 
        events: b.events.filter(e => e.id !== eventId)
      }
    ));
  }

  function toggleDaySelection(dayIdx) {
    setAddEventDays(prev => 
      prev.includes(dayIdx) 
        ? prev.filter(d => d !== dayIdx)
        : [...prev, dayIdx]
    );
  }

  return {
    buckets,
    selectedBucket,
    panel,
    addEventDays,
    addEventStartTime,
    addEventEndTime,
    addEventDuration,
    addEventLabel,
    eventError,
    showDaySelector,
    newBucketName,
    newBucketPriority,
    allEvents,
    setSelectedBucket,
    setPanel,
    setAddEventStartTime,
    setAddEventEndTime,
    setAddEventDuration,
    setAddEventLabel,
    setEventError,
    setShowDaySelector,
    setNewBucketName,
    setNewBucketPriority,
    setBuckets,
    addBucket,
    removeBucket,
    addEventToDays,
    editEvent,
    removeEvent,
    toggleDaySelection,
    getAvailableSlots,
    getLockingEvents,
    findConflicts,
  };
}
