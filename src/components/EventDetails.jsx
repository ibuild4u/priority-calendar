import React from 'react'
import { DAYS, DAY_FULL } from '../constants/palette';
import { formatTime, formatDuration } from '../utils/helpers';

export function EventDetails({ activeBucket, removeEvent }) {
  if (!activeBucket) return null;
  
  return (
    <div style={{ width: 240, background: "#e8e2d6", borderLeft: "1px solid #d0c8bc", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #d0c8bc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: activeBucket.color.light }} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>{activeBucket.name}</span>
          <span style={{ fontSize: 9, color: "#8a7e6a", marginLeft: "auto" }}>P{activeBucket.priority}</span>
        </div>
        <div style={{ fontSize: 9, color: "#8a7e6a", marginTop: 6 }}>
          {activeBucket.events.length} events · {formatDuration(activeBucket.events.reduce((s, e) => s + e.durationMins, 0))} total
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {activeBucket.events.length === 0 ? (
          <div style={{ fontSize: 10, color: "#b0a898", padding: "18px 14px", textAlign: "center" }}>
            No events yet.<br />Select days, set start/end times
          </div>
        ) : (
          [...activeBucket.events].sort((a, b) => a.dayIdx - b.dayIdx || a.startMin - b.startMin).map(ev => (
            <div key={ev.id} style={{ padding: "8px 12px", borderBottom: "1px solid #ddd6c8" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 3, height: 36, borderRadius: 2, background: activeBucket.color.bg, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 500 }}>{DAYS[ev.dayIdx]}</div>
                  <div style={{ fontSize: 9, color: "#7a6e62" }}>
                    {formatTime(ev.startMin)} – {formatTime(ev.startMin + ev.durationMins)} ({formatDuration(ev.durationMins)})
                  </div>
                  {ev.label !== activeBucket.name && (
                    <div style={{ fontSize: 9, color: "#9a8e80", marginTop: 1 }}>{ev.label}</div>
                  )}
                </div>
                <button onClick={() => removeEvent(activeBucket.id, ev.id)} 
                  style={{ background: "none", border: "none", color: "#c0a898", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: "1px solid #d0c8bc", padding: "12px 14px", background: "#e0d8ce" }}>
        <div style={{ fontSize: 8, color: "#6a5e4a", marginBottom: 6 }}>PRIORITY LOCKING</div>
        <div style={{ fontSize: 9, color: "#5a4e3e", lineHeight: 1.4 }}>
          {activeBucket.priority === 1 ? (
            "🔒 Highest priority - nothing blocks this"
          ) : (
            `⚠️ Priority ${activeBucket.priority} cannot overlap with P${activeBucket.priority - 1}`
          )}
        </div>
      </div>
    </div>
  );
}
