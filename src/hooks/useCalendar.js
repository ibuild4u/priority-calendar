import { useState, useMemo } from 'react';
import { uid, overlaps, formatTime, dateFromDayIdx, dayIdxFromDate, getEventDate } from '../utils/helpers';
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
  const [conflictPreview, setConflictPreview] = useState(null);
  const [pendingEvent, setPendingEvent] = useState(null);

  // All events flattened, with date migration applied
  const allEvents = useMemo(() => {
    const list = [];
    buckets.forEach(b => {
      b.events.forEach(ev => {
        const date = getEventDate(ev);
        const dayIdx = ev.dayIdx ?? dayIdxFromDate(date);
        list.push({ ...ev, date, dayIdx, bucketId: b.id, bucketName: b.name, bucketPriority: b.priority, color: b.color });
      });
    });
    return list.sort((a, b) => a.bucketPriority - b.bucketPriority);
  }, [buckets]);

  // Available free slots for a bucket on a specific date
  function getAvailableSlots(bucketId, date) {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return [{ start: 0, end: 24 * 60, duration: 24 * 60 }];
    const dayEvents = bucket.events.filter(e => getEventDate(e) === date);
    if (dayEvents.length === 0) return [{ start: 0, end: 24 * 60, duration: 24 * 60 }];
    const sorted = [...dayEvents].sort((a, b) => a.startMin - b.startMin);
    const slots = [];
    let cur = 0;
    const dayEnd = 24 * 60;
    for (const ev of sorted) {
      if (cur < ev.startMin) slots.push({ start: cur, end: ev.startMin, duration: ev.startMin - cur });
      cur = Math.max(cur, ev.startMin + ev.durationMins);
    }
    if (cur < dayEnd) slots.push({ start: cur, end: dayEnd, duration: dayEnd - cur });
    return slots.filter(s => s.duration >= 15);
  }

  // Events from higher-priority buckets that block bucketId
  function getLockingEvents(bucketId) {
    const currentBucket = buckets.find(b => b.id === bucketId);
    if (!currentBucket) return [];
    const result = [];
    buckets.forEach(b => {
      if (b.priority < currentBucket.priority) {
        b.events.forEach(ev => {
          result.push({ ...ev, date: getEventDate(ev), bucketId: b.id, bucketName: b.name, bucketPriority: b.priority, color: b.color });
        });
      }
    });
    return result;
  }

  // Used only by editEvent (dayIdx-based, unchanged)
  function findConflicts(bucketId, dayIdx, startMin, endMin, excludeEventId = null) {
    const conflicts = [];
    const lockingEvents = getLockingEvents(bucketId);
    const currentBucket = buckets.find(b => b.id === bucketId);
    for (const lock of lockingEvents) {
      if ((lock.dayIdx ?? dayIdxFromDate(lock.date)) !== dayIdx) continue;
      const lockEnd = lock.startMin + lock.durationMins;
      if (overlaps({ startMin, endMin }, { startMin: lock.startMin, endMin: lockEnd })) {
        conflicts.push({ eventName: lock.label, bucketName: lock.bucketName, priority: lock.bucketPriority, time: formatTime(lock.startMin) + '-' + formatTime(lockEnd) });
      }
    }
    if (currentBucket) {
      for (const ev of currentBucket.events) {
        if (excludeEventId && ev.id === excludeEventId) continue;
        if ((ev.dayIdx ?? dayIdxFromDate(getEventDate(ev))) !== dayIdx) continue;
        const evEnd = ev.startMin + ev.durationMins;
        if (overlaps({ startMin, endMin }, { startMin: ev.startMin, endMin: evEnd })) {
          conflicts.push({ eventName: ev.label, bucketName: currentBucket.name, priority: currentBucket.priority, time: formatTime(ev.startMin) + '-' + formatTime(evEnd), isSameBucket: true });
        }
      }
    }
    return conflicts;
  }

  function computeSplitSegments(startMin, endMin, lockingEvents) {
    const blocking = lockingEvents
      .filter(lock => overlaps({ startMin, endMin }, { startMin: lock.startMin, endMin: lock.startMin + lock.durationMins }))
      .sort((a, b) => a.startMin - b.startMin);
    if (blocking.length === 0) return [{ startMin, durationMins: endMin - startMin }];
    const segments = [];
    let cur = startMin;
    for (const lock of blocking) {
      const lockEnd = lock.startMin + lock.durationMins;
      if (lock.startMin > cur) segments.push({ startMin: cur, durationMins: lock.startMin - cur });
      cur = Math.max(cur, lockEnd);
    }
    if (cur < endMin) segments.push({ startMin: cur, durationMins: endMin - cur });
    return segments;
  }

  function computeClippedEvent(startMin, endMin, lockingEvents) {
    const blocking = lockingEvents
      .filter(lock => overlaps({ startMin, endMin }, { startMin: lock.startMin, endMin: lock.startMin + lock.durationMins }))
      .sort((a, b) => a.startMin - b.startMin);
    if (blocking.length === 0) return { startMin, durationMins: endMin - startMin };
    let effectiveStart = startMin;
    for (const lock of blocking) {
      const lockEnd = lock.startMin + lock.durationMins;
      if (lock.startMin <= effectiveStart && lockEnd > effectiveStart) effectiveStart = lockEnd;
    }
    if (effectiveStart >= endMin) return null;
    let clipEnd = endMin;
    for (const lock of blocking) {
      if (lock.startMin > effectiveStart && lock.startMin < clipEnd) clipEnd = lock.startMin;
    }
    if (clipEnd <= effectiveStart) return null;
    return { startMin: effectiveStart, durationMins: clipEnd - effectiveStart };
  }

  function addBucket() {
    const name = newBucketName.trim();
    if (!name) { setEventError("Bucket name required"); return; }
    const priority = parseInt(newBucketPriority);
    if (isNaN(priority) || priority < 1) { setEventError("Priority must be a number (1 = highest)"); return; }
    if (buckets.some(b => b.priority === priority)) { setEventError(`Priority ${priority} already exists`); return; }
    const color = PALETTE[buckets.length % PALETTE.length];
    const newBucket = { id: uid(), name, priority, color, events: [] };
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
    if (selectedBucket === id) setSelectedBucket(remaining[0]?.id || null);
  }

  // Core add function. dates[] is parallel to dayIndices[] — provides the canonical date for each.
  // targetBucketId overrides selectedBucket (used by addEventOnDate).
  // Returns true=success, null=conflict (modal shown), false=hard error.
  function addEventToDays(dayIndices, startMin, durationMins, label, dates = null, targetBucketId = null) {
    const bucketId = targetBucketId ?? selectedBucket;
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) { setEventError("Please select a bucket first"); return false; }
    const endMin = startMin + durationMins;
    if (startMin < 0 || endMin > 24 * 60) { setEventError("Event time must be between 12am and 12am"); return false; }

    // Same-bucket overlaps: hard error, no modal
    const sameBucketErrors = [];
    for (let i = 0; i < dayIndices.length; i++) {
      const date = dates?.[i] ?? dateFromDayIdx(dayIndices[i]);
      const conflict = bucket.events.find(ev =>
        getEventDate(ev) === date &&
        overlaps({ startMin, endMin }, { startMin: ev.startMin, endMin: ev.startMin + ev.durationMins })
      );
      if (conflict) sameBucketErrors.push(`${date}: Overlaps "${conflict.label}"`);
    }
    if (sameBucketErrors.length > 0) { setEventError(sameBucketErrors.join("; ")); return false; }

    // Higher-priority conflicts: show modal
    const allLockingConflicts = [];
    for (let i = 0; i < dayIndices.length; i++) {
      const date = dates?.[i] ?? dateFromDayIdx(dayIndices[i]);
      const lockingOnDate = getLockingEvents(bucketId).filter(e => getEventDate(e) === date);
      lockingOnDate.forEach(lock => {
        const lockEnd = lock.startMin + lock.durationMins;
        if (overlaps({ startMin, endMin }, { startMin: lock.startMin, endMin: lockEnd })) {
          allLockingConflicts.push({
            dayIdx: dayIndices[i],
            bucketName: lock.bucketName,
            priority: lock.bucketPriority,
            time: `${date} ${formatTime(lock.startMin)}-${formatTime(lockEnd)}`
          });
        }
      });
    }
    if (allLockingConflicts.length > 0) {
      setPendingEvent({ dayIndices, startMin, durationMins, label, dates, bucketId });
      setConflictPreview({ conflicts: allLockingConflicts });
      setEventError("");
      return null;
    }

    // No conflicts — add all events
    const resolvedDates = dayIndices.map((dayIdx, i) => dates?.[i] ?? dateFromDayIdx(dayIdx));
    const newEvents = dayIndices.map((dayIdx, i) => ({
      id: uid(), date: resolvedDates[i], dayIdx, startMin, durationMins,
      label: label.trim() || bucket.name
    }));
    setBuckets(prev => prev.map(b => b.id !== bucketId ? b : { ...b, events: [...b.events, ...newEvents] }));
    setEventError("");
    return true;
  }

  // Convenience for modal: single date, explicit bucket
  function addEventOnDate(targetBucketId, date, startMin, durationMins, label) {
    setSelectedBucket(targetBucketId);
    const dayIdx = dayIdxFromDate(date);
    return addEventToDays([dayIdx], startMin, durationMins, label, [date], targetBucketId);
  }

  function confirmOverride(strategy) {
    if (!pendingEvent) return;
    const { dayIndices, startMin, durationMins, label, dates, bucketId: pendingBucketId } = pendingEvent;
    const targetBucketId = pendingBucketId ?? selectedBucket;
    const bucket = buckets.find(b => b.id === targetBucketId);
    if (!bucket) { setConflictPreview(null); setPendingEvent(null); return; }
    const endMin = startMin + durationMins;
    const eventLabel = label.trim() || bucket.name;
    const resolvedDates = dayIndices.map((dayIdx, i) => dates?.[i] ?? dateFromDayIdx(dayIdx));

    if (strategy === 'split') {
      const toAdd = [];
      for (let i = 0; i < dayIndices.length; i++) {
        const dayIdx = dayIndices[i];
        const date = resolvedDates[i];
        const lockingOnDate = getLockingEvents(targetBucketId).filter(e => getEventDate(e) === date);
        computeSplitSegments(startMin, endMin, lockingOnDate)
          .filter(s => s.durationMins >= 15)
          .forEach(s => toAdd.push({ ...s, dayIdx, date }));
      }
      if (toAdd.length > 0) {
        setBuckets(prev => prev.map(b => {
          if (b.id !== targetBucketId) return b;
          const newEvents = toAdd.map(s => ({ id: uid(), date: s.date, dayIdx: s.dayIdx, startMin: s.startMin, durationMins: s.durationMins, label: eventLabel }));
          return { ...b, events: [...b.events, ...newEvents] };
        }));
      }
    } else if (strategy === 'clip') {
      const toAdd = [];
      for (let i = 0; i < dayIndices.length; i++) {
        const dayIdx = dayIndices[i];
        const date = resolvedDates[i];
        const lockingOnDate = getLockingEvents(targetBucketId).filter(e => getEventDate(e) === date);
        const clipped = computeClippedEvent(startMin, endMin, lockingOnDate);
        if (clipped && clipped.durationMins >= 15) toAdd.push({ ...clipped, dayIdx, date });
      }
      if (toAdd.length > 0) {
        setBuckets(prev => prev.map(b => {
          if (b.id !== targetBucketId) return b;
          const newEvents = toAdd.map(s => ({ id: uid(), date: s.date, dayIdx: s.dayIdx, startMin: s.startMin, durationMins: s.durationMins, label: eventLabel }));
          return { ...b, events: [...b.events, ...newEvents] };
        }));
      }
    } else if (strategy === 'override') {
      setBuckets(prev => {
        const withRemovals = prev.map(b => {
          if (b.id === targetBucketId) return b;
          return {
            ...b,
            events: b.events.filter(ev => {
              if (!resolvedDates.includes(getEventDate(ev))) return true;
              return !overlaps({ startMin, endMin }, { startMin: ev.startMin, endMin: ev.startMin + ev.durationMins });
            })
          };
        });
        return withRemovals.map(b => {
          if (b.id !== targetBucketId) return b;
          const newEvents = dayIndices.map((dayIdx, i) => ({ id: uid(), date: resolvedDates[i], dayIdx, startMin, durationMins, label: eventLabel }));
          return { ...b, events: [...b.events, ...newEvents] };
        });
      });
    }

    setConflictPreview(null);
    setPendingEvent(null);
    setEventError("");
  }

  function cancelOverride() {
    setConflictPreview(null);
    setPendingEvent(null);
  }

  function editEvent(eventId, bucketId, updatedData) {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return false;
    const eventToEdit = bucket.events.find(e => e.id === eventId);
    if (!eventToEdit) return false;
    const newStartMin = updatedData.startMin;
    const newDurationMins = updatedData.durationMins;
    const newEndMin = newStartMin + newDurationMins;
    const dayIdx = eventToEdit.dayIdx ?? dayIdxFromDate(getEventDate(eventToEdit));
    const conflicts = findConflicts(bucketId, dayIdx, newStartMin, newEndMin, eventId);
    if (conflicts.length > 0) { setEventError(`Cannot edit: Conflicts with ${conflicts[0].bucketName} at ${conflicts[0].time}`); return false; }
    setBuckets(prev => prev.map(b => {
      if (b.id !== bucketId) return b;
      return { ...b, events: b.events.map(e => e.id === eventId ? { ...e, ...updatedData, durationMins: newDurationMins, label: updatedData.label || e.label } : e) };
    }));
    setEventError("");
    return true;
  }

  function removeEvent(bucketId, eventId) {
    setBuckets(prev => prev.map(b => b.id !== bucketId ? b : { ...b, events: b.events.filter(e => e.id !== eventId) }));
  }

  function toggleDaySelection(dayIdx) {
    setAddEventDays(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]);
  }

  return {
    buckets, selectedBucket, panel, addEventDays, addEventStartTime, addEventEndTime,
    addEventDuration, addEventLabel, eventError, showDaySelector, newBucketName, newBucketPriority,
    allEvents, conflictPreview, pendingEvent,
    setSelectedBucket, setPanel, setAddEventStartTime, setAddEventEndTime,
    setAddEventDuration, setAddEventLabel, setEventError, setShowDaySelector,
    setNewBucketName, setNewBucketPriority, setAddEventDays,
    setBuckets, addBucket, removeBucket, addEventToDays, addEventOnDate,
    editEvent, removeEvent, toggleDaySelection,
    getAvailableSlots, getLockingEvents, findConflicts,
    confirmOverride, cancelOverride,
  };
}
