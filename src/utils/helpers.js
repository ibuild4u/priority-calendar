export function parseDuration(str) {
  if (!str || str.trim() === "") return null;
  str = str.trim().toLowerCase();
  const hm = str.match(/(\d+(?:\.\d+)?)\s*h(?:r|ours?)?\s*(?:(\d+)\s*m?)?/);
  if (hm) {
    let mins = parseFloat(hm[1]) * 60;
    if (hm[2]) mins += parseInt(hm[2]);
    return Math.round(mins);
  }
  const mOnly = str.match(/^(\d+)\s*m/);
  if (mOnly) return parseInt(mOnly[1]);
  const hOnly = str.match(/^(\d+(?:\.\d+)?)\s*h/);
  if (hOnly) return Math.round(parseFloat(hOnly[1]) * 60);
  const plain = str.match(/^(\d+)$/);
  if (plain) return parseInt(plain[1]);
  return null;
}

export function formatDuration(mins) {
  if (!mins && mins !== 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return "0m";
}

export function parseTime(str) {
  if (!str || str.trim() === "") return null;
  str = str.trim().toLowerCase().replace(/\s/g, "");
  const ampm = str.match(/^(\d{1,2})(?::(\d{2}))?([ap]m)$/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = ampm[2] ? parseInt(ampm[2]) : 0;
    if (ampm[3] === "pm" && h !== 12) h += 12;
    if (ampm[3] === "am" && h === 12) h = 0;
    return h * 60 + m;
  }
  const mil = str.match(/^(\d{1,2}):(\d{2})$/);
  if (mil) return parseInt(mil[1]) * 60 + parseInt(mil[2]);
  const compact = str.match(/^(\d{3,4})$/);
  if (compact) {
    const s = compact[1].padStart(4, "0");
    return parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(2));
  }
  const justH = str.match(/^(\d{1,2})$/);
  if (justH) return parseInt(justH[1]) * 60;
  return null;
}

export function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

export function overlaps(a, b) {
  return a.startMin < b.endMin && a.endMin > b.startMin;
}

export function uid() { 
  return Math.random().toString(36).slice(2, 9); 
}