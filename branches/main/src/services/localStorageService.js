// src/build_000_002/services/localStorageService.js

const STORAGE_KEY = 'priority_calendar_data'
const USER_KEY = 'priority_calendar_user'

export const storageService = {
  login(username) {
    const users = this.getAllUsers()
    if (!users.includes(username)) {
      users.push(username)
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users))
    }
    localStorage.setItem(USER_KEY, username)
    return username
  },

  logout() {
    localStorage.removeItem(USER_KEY)
  },

  getCurrentUser() {
    return localStorage.getItem(USER_KEY)
  },

  getAllUsers() {
    const users = localStorage.getItem(`${STORAGE_KEY}_users`)
    return users ? JSON.parse(users) : []
  },

  // Theme preference methods
  saveThemePreference(username, themeName) {
    const userPrefs = this.getUserPreferences(username)
    userPrefs.theme = themeName
    localStorage.setItem(`${STORAGE_KEY}_prefs_${username}`, JSON.stringify(userPrefs))
  },

  getThemePreference(username) {
    const userPrefs = this.getUserPreferences(username)
    return userPrefs.theme || 'default'
  },

  getUserPreferences(username) {
    const prefs = localStorage.getItem(`${STORAGE_KEY}_prefs_${username}`)
    return prefs ? JSON.parse(prefs) : {}
  },

  saveCalendar(buckets, calendarName = 'My Calendar') {
    const user = this.getCurrentUser()
    if (!user) throw new Error('No user logged in')

    const userCalendars = this.getUserCalendars(user)
    const newCalendar = {
      id: Date.now().toString(),
      name: calendarName,
      buckets: buckets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    userCalendars.push(newCalendar)
    localStorage.setItem(`${STORAGE_KEY}_${user}`, JSON.stringify(userCalendars))
    return newCalendar
  },

  getUserCalendars(user = null) {
    const currentUser = user || this.getCurrentUser()
    if (!currentUser) return []
    
    const calendars = localStorage.getItem(`${STORAGE_KEY}_${currentUser}`)
    return calendars ? JSON.parse(calendars) : []
  },

  loadCalendar(calendarId) {
    const calendars = this.getUserCalendars()
    return calendars.find(cal => cal.id === calendarId)
  },

  deleteCalendar(calendarId) {
    const user = this.getCurrentUser()
    if (!user) return
    
    let calendars = this.getUserCalendars()
    calendars = calendars.filter(cal => cal.id !== calendarId)
    localStorage.setItem(`${STORAGE_KEY}_${user}`, JSON.stringify(calendars))
  },

  updateCalendar(calendarId, buckets, name) {
    const user = this.getCurrentUser()
    if (!user) return
    
    let calendars = this.getUserCalendars()
    const index = calendars.findIndex(cal => cal.id === calendarId)
    if (index !== -1) {
      calendars[index] = {
        ...calendars[index],
        buckets: buckets,
        name: name || calendars[index].name,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(`${STORAGE_KEY}_${user}`, JSON.stringify(calendars))
    }
  },

  exportToJSON() {
    const user = this.getCurrentUser()
    if (!user) return
    
    const data = {
      user: user,
      calendars: this.getUserCalendars(),
      preferences: this.getUserPreferences(user),
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
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const user = this.getCurrentUser()
          if (data.calendars) {
            localStorage.setItem(`${STORAGE_KEY}_${user}`, JSON.stringify(data.calendars))
          }
          if (data.preferences) {
            localStorage.setItem(`${STORAGE_KEY}_prefs_${user}`, JSON.stringify(data.preferences))
          }
          resolve(data.calendars)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }
}
