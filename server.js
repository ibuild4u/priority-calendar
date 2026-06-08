import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'public', 'data')
const USERS_DIR = path.join(DATA_DIR, 'users')

const uid = () => Math.random().toString(36).slice(2, 9)

const PALETTE = [
  { bg: '#c0392b', light: '#e74c3c' },
  { bg: '#d35400', light: '#e67e22' },
  { bg: '#1a7a4a', light: '#27ae60' },
]

async function seedTestUser() {
  const userDir = path.join(USERS_DIR, 'testuser')
  try {
    await fs.access(userDir)
    console.log('[seed] testuser already exists, skipping')
    return
  } catch {
    // doesn't exist — seed it
  }

  try {
    await fs.mkdir(userDir, { recursive: true })

    const dwId = uid()
    const clsId = uid()
    const admId = uid()

    const profile = {
      username: 'testuser',
      theme: 'default',
      createdAt: new Date().toISOString()
    }

    const calendars = [
      {
        id: uid(),
        name: 'My Week',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        buckets: [
          {
            id: dwId,
            name: 'Deep Work',
            priority: 1,
            color: PALETTE[0],
            events: [
              { id: uid(), dayIdx: 0, startMin: 540, durationMins: 180, label: 'Deep Work' },
              { id: uid(), dayIdx: 1, startMin: 540, durationMins: 180, label: 'Deep Work' },
              { id: uid(), dayIdx: 2, startMin: 540, durationMins: 180, label: 'Deep Work' },
              { id: uid(), dayIdx: 3, startMin: 540, durationMins: 180, label: 'Deep Work' }
            ]
          },
          {
            id: clsId,
            name: 'Classes',
            priority: 2,
            color: PALETTE[1],
            events: [
              { id: uid(), dayIdx: 0, startMin: 780, durationMins: 90, label: 'Calculus' },
              { id: uid(), dayIdx: 2, startMin: 780, durationMins: 90, label: 'Physics' },
              { id: uid(), dayIdx: 4, startMin: 600, durationMins: 90, label: 'CS' }
            ]
          },
          {
            id: admId,
            name: 'Admin',
            priority: 3,
            color: PALETTE[2],
            events: [
              { id: uid(), dayIdx: 0, startMin: 480, durationMins: 30, label: 'Email' },
              { id: uid(), dayIdx: 4, startMin: 960, durationMins: 60, label: 'Weekly Review' }
            ]
          }
        ]
      }
    ]

    const tasks = {
      bucketTasks: {
        [dwId]: [],
        [clsId]: [
          { id: 't1', text: 'Calculus problem set 3', type: 'assign', due: '', done: false },
          { id: 't2', text: 'Physics midterm', type: 'exam', due: '', done: false },
          { id: 't3', text: 'Study CS algorithms', type: 'study', due: '', done: false }
        ],
        [admId]: [
          { id: 't4', text: 'Reply to professor emails', type: 'assign', due: '', done: false }
        ]
      }
    }

    await fs.writeFile(path.join(userDir, 'profile.json'), JSON.stringify(profile, null, 2))
    await fs.writeFile(path.join(userDir, 'calendars.json'), JSON.stringify(calendars, null, 2))
    await fs.writeFile(path.join(userDir, 'tasks.json'), JSON.stringify(tasks, null, 2))

    console.log('[seed] created testuser with pre-loaded calendar and tasks')
  } catch (err) {
    console.error('[seed] error:', err.message)
  }
}

async function reseedTestUser() {
  const userDir = path.join(USERS_DIR, 'testuser')
  await fs.rm(userDir, { recursive: true, force: true })
  await seedTestUser()
}

// ── Express app ────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Write a JSON file under public/data/
// Body: { filepath: "users/testuser/profile.json", data: { ... } }
app.post('/api/save', async (req, res) => {
  try {
    const { filepath, data } = req.body
    if (!filepath) return res.status(400).json({ error: 'filepath required' })
    const fullPath = path.join(DATA_DIR, filepath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8')
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete a file under public/data/
// Body: { filepath: "users/testuser/profile.json" }
app.delete('/api/delete', async (req, res) => {
  try {
    const { filepath } = req.body
    if (!filepath) return res.status(400).json({ error: 'filepath required' })
    const fullPath = path.join(DATA_DIR, filepath)
    await fs.unlink(fullPath).catch(() => {})
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Dev-only: reset testuser to seed state
// DELETE /api/seed/reset
app.delete('/api/seed/reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' })
  }
  try {
    await reseedTestUser()
    res.json({ success: true, message: 'testuser reset and reseeded' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, async () => {
  console.log(`File write server running on http://localhost:${PORT}`)
  await seedTestUser()
})
