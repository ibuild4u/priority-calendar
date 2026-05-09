// src/components/BucketManager.jsx
import { formatDuration } from '../utils/helpers'

export function BucketManager({ 
  buckets, selectedBucket, setSelectedBucket,
  newBucketName, setNewBucketName,
  newBucketPriority, setNewBucketPriority,
  addBucket, removeBucket, onClose, colors
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: colors.sidebarBg,
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.sidebarBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Manage Buckets</h3>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {buckets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#b0a898' }}>No buckets yet. Create one below.</div>
          ) : (
            buckets.map((b) => (
              <div key={b.id} 
                onClick={() => setSelectedBucket(b.id)} 
                style={{ 
                  padding: '12px', 
                  marginBottom: '8px',
                  background: selectedBucket === b.id ? colors.timeRulerBg : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: `1px solid ${colors.sidebarBorder}`
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: b.color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>{b.priority}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: '#b0a898' }}>
                      {b.events.length} events · {formatDuration(b.events.reduce((sum, e) => sum + e.durationMins, 0))} total
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeBucket(b.id); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#c0392b' }}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div style={{ padding: '16px', borderTop: `1px solid ${colors.sidebarBorder}` }}>
          <input 
            placeholder="Bucket name" 
            value={newBucketName} 
            onChange={e => setNewBucketName(e.target.value)} 
            style={{ width: '100%', marginBottom: '8px' }} 
          />
          <input 
            placeholder="Priority (1 = highest)" 
            value={newBucketPriority} 
            onChange={e => setNewBucketPriority(e.target.value)} 
            type="number" 
            min="1" 
            style={{ width: '100%', marginBottom: '12px' }} 
          />
          <button className="btn-solid" onClick={addBucket} style={{ width: '100%' }}>+ CREATE BUCKET</button>
        </div>
      </div>
    </div>
  )
}
