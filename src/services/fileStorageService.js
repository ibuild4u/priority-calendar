// File-based storage — reads from /public/data/ (Vite static), writes via Express on :3001
// BASE_URL is '/priority-calendar/' in dev/prod — public files live under that prefix

const DATA_ROOT = `${import.meta.env.BASE_URL}data`

async function readJSON(url, fallback = null) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  }
}

async function saveFile(filepath, data) {
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, data })
  })
  if (!res.ok) throw new Error(`Save failed: ${filepath}`)
}

export const storageService = {
  async login(username) {
    await saveFile('session.json', { user: username })
    return username
  },

  async logout() {
    await saveFile('session.json', { user: null })
  },

  async getCurrentUser() {
    const session = await readJSON(`${DATA_ROOT}/session.json`, { user: null })
    return session.user
  },

  async saveThemePreference(username, theme) {
    const profile = await readJSON(`${DATA_ROOT}/users/${username}/profile.json`, {})
    await saveFile(`users/${username}/profile.json`, { ...profile, username, theme })
  },

  async getThemePreference(username) {
    const profile = await readJSON(`${DATA_ROOT}/users/${username}/profile.json`, {})
    return profile.theme || 'default'
  },

  async saveCalendar(buckets, calendarName = 'My Calendar') {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No user logged in')
    const calendars = await this.getUserCalendars()
    const newCalendar = {
      id: Date.now().toString(),
      name: calendarName,
      buckets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    calendars.push(newCalendar)
    await saveFile(`users/${user}/calendars.json`, calendars)
    return newCalendar
  },

  async getUserCalendars(user = null) {
    const currentUser = user || await this.getCurrentUser()
    if (!currentUser) return []
    return readJSON(`${DATA_ROOT}/users/${currentUser}/calendars.json`, [])
  },

  async loadCalendar(calendarId) {
    const calendars = await this.getUserCalendars()
    return calendars.find(cal => cal.id === calendarId) || null
  },

  async deleteCalendar(calendarId) {
    const user = await this.getCurrentUser()
    if (!user) return
    const calendars = await this.getUserCalendars()
    const filtered = calendars.filter(cal => cal.id !== calendarId)
    await saveFile(`users/${user}/calendars.json`, filtered)
  },

  async updateCalendar(calendarId, buckets, name) {
    const user = await this.getCurrentUser()
    if (!user) return
    const calendars = await this.getUserCalendars()
    const index = calendars.findIndex(cal => cal.id === calendarId)
    if (index !== -1) {
      calendars[index] = {
        ...calendars[index],
        buckets,
        name: name || calendars[index].name,
        updatedAt: new Date().toISOString()
      }
      await saveFile(`users/${user}/calendars.json`, calendars)
    }
  },

  async exportToJSON() {
    const user = await this.getCurrentUser()
    if (!user) return
    const data = {
      user,
      calendars: await this.getUserCalendars(),
      preferences: await readJSON(`${DATA_ROOT}/users/${user}/profile.json`, {}),
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${user}_calendar_backup.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const user = await this.getCurrentUser()
          if (data.calendars) {
            await saveFile(`users/${user}/calendars.json`, data.calendars)
          }
          if (data.preferences) {
            await saveFile(`users/${user}/profile.json`, data.preferences)
          }
          resolve(data.calendars || [])
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }
}
