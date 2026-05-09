import React from 'react'
import { formatDuration } from '../utils/helpers';

export function Sidebar({ 
  buckets, selectedBucket, setSelectedBucket, 
  panel, setPanel, newBucketName, setNewBucketName,
  newBucketPriority, setNewBucketPriority, addBucket, removeBucket 
}) {
  return (
    <div style={{ width: 260, background: "#ede8de", borderRight: "1px solid #d8d0c4", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "10px 14px 8px", fontSize: 9, color: "#9a8e80", borderBottom: "1px solid #ddd6c8" }}>
        BUCKETS (lower number = higher priority)
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {buckets.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 11, color: "#b0a898" }}>
            No buckets yet.<br />Click "+ NEW BUCKET" to start
          </div>
        ) : (
          buckets.map((b) => (
            <div key={b.id} 
              className={`bucket-row ${selectedBucket === b.id ? "active" : ""}`} 
              onClick={() => setSelectedBucket(b.id)} 
              style={{ padding: "10px 12px", borderBottom: "1px solid #e0d8cc", cursor: "pointer", background: selectedBucket === b.id ? "#e2dbd0" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: b.color.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{b.priority}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: "#b0a898", marginTop: 2 }}>
                    {b.events.length} events · {formatDuration(b.events.reduce((sum, e) => sum + e.durationMins, 0))} total
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeBucket(b.id); }} 
                  style={{ background: "none", border: "none", fontSize: 12, cursor: "pointer", color: "#c0392b" }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: "1px solid #d0c8bc", padding: "12px" }}>
        {panel === "addBucket" ? (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <input placeholder="Bucket name" value={newBucketName} onChange={e => setNewBucketName(e.target.value)} autoFocus />
            <input placeholder="Priority (1 = highest)" value={newBucketPriority} onChange={e => setNewBucketPriority(e.target.value)} type="number" min="1" />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn-solid" onClick={addBucket} style={{ flex: 1 }}>CREATE</button>
              <button className="btn-ghost" onClick={() => setPanel(null)}>✕</button>
            </div>
          </div>
        ) : (
          <button className="btn-solid" onClick={() => setPanel("addBucket")} style={{ width: "100%" }}>+ NEW BUCKET</button>
        )}
      </div>
    </div>
  );
}
