import React from 'react'
import { DAYS } from '../constants/palette';

export function DaySelector({ addEventDays, toggleDaySelection, onClose }) {
  return (
    <div className="fade-up" style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 5 }}>
      {DAYS.map((day, idx) => (
        <div
          key={idx}
          className={`day-chip ${addEventDays.includes(idx) ? "selected" : ""}`}
          onClick={() => toggleDaySelection(idx)}
          style={{
            display: "inline-flex",
            padding: "4px 10px",
            background: addEventDays.includes(idx) ? "#3a3028" : "#ece7dc",
            border: "1px solid #c8bfaf",
            borderRadius: "20px",
            fontSize: 11,
            cursor: "pointer",
            color: addEventDays.includes(idx) ? "white" : "#7a6e62"
          }}
        >
          {day}
        </div>
      ))}
      <button className="btn-ghost" onClick={onClose} style={{ padding: "4px 12px" }}>Done</button>
    </div>
  );
}
