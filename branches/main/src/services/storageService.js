import { storageService as fileService }  from './fileStorageService'
import { storageService as localService } from './localStorageService'

// Electron shell always serves from localhost; GitHub Pages never does.
const isLocal = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'

export const storageService = isLocal ? fileService : localService
