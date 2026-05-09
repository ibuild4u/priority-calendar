import React from 'react'
export function Header({ buckets }) {
  return (
    <div style={{ background: "#1a1a10", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#f5f0e8", fontWeight: 900 }}>Priority Lock</div>
        <div style={{ fontSize: 9, color: "#6a5e4a", marginTop: 1 }}>EVENT-LEVEL DURATION · MULTI-DAY · PRIORITY LOCKING</div>
      </div>
      {buckets.length > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          {buckets.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: b.color.light }} />
              <span style={{ fontSize: 10, color: "#7a6e5a" }}>P{b.priority}: {b.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
