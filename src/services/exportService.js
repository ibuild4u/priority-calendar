// src/build_000_002/services/exportService.js
import { toPng, toSvg, toJpeg } from 'html-to-image'

export const exportService = {
  async exportAsPNG(elementId, filename = 'calendar') {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Element not found')

    try {
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#f5f0e8'
      })
      
      const link = document.createElement('a')
      link.download = filename + '.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  },

  async exportAsSVG(elementId, filename = 'calendar') {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Element not found')

    try {
      const dataUrl = await toSvg(element, {
        pixelRatio: 1,
        backgroundColor: '#f5f0e8'
      })
      
      const link = document.createElement('a')
      link.download = filename + '.svg'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  },

  async exportAsJPEG(elementId, filename = 'calendar') {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Element not found')

    try {
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#f5f0e8'
      })
      
      const link = document.createElement('a')
      link.download = filename + '.jpg'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  },

  exportAsJSON(buckets, filename = 'calendar_data') {
    const data = {
      exportDate: new Date().toISOString(),
      buckets: buckets,
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = filename + '.json'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }
}
