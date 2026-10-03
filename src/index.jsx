import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { darkMode, lightMode } from './index.css'
import DataContextProvider from './DataProvider.jsx'

if (window.OFFLINE_PLUGIN_ENABLED) {
  navigator.serviceWorker?.register?.('sw.js', {})
}

const theme = window.localStorage.getItem('THEME')
if (theme) document.body.classList.add(theme === 'DARK' ? darkMode : lightMode)

const difficulties = {
  easy: '3',
  medium: '12',
  hard: '30',
}

const themeOptions = {
  unset: 'OS Default',
  LIGHT: 'Light',
  DARK: 'Dark',
}

import('./data/index.mjs').then((tilesets) => {
  const testHeight = 32
  const canvas = document.createElement('canvas')
  canvas.width = 54
  canvas.height = testHeight

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.font = `${testHeight}px system`

  const removed = (window.REMOVED_TILES = [])
  const idealWidth = ctx.measureText('🇨🇦').width

  for (const value of Object.values(tilesets)) {
    for (let i = value.length - 1; i >= 0; i--) {
      const thisvalue = value[i]
      const actualWidth = ctx.measureText(thisvalue.emoji).width
      if (actualWidth !== idealWidth) removed.push(...value.splice(i, 1))
    }
  }
  const root = createRoot(document.getElementById('root'))
  root.render(
    <DataContextProvider value={{ tilesets, difficulties, themeOptions }}>
      <App />
    </DataContextProvider>,
  )
})
