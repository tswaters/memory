import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { HighScoresProvider } from './HighScores.jsx'
import { darkMode, lightMode } from './index.css'
import * as tilesets from './data/index.js'

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', {})

const theme = window.localStorage.getItem('THEME')
if (theme) document.body.classList.add(theme === 'DARK' ? darkMode : lightMode)

const testHeight = 32
const canvas = document.createElement('canvas')
canvas.width = 54
canvas.height = testHeight

const ctx = canvas.getContext('2d')
ctx.fillStyle = '#000'
ctx.font = `${testHeight}px system`

const removed = []
const idealWidth = ctx.measureText('🇨🇦').width

for (const value of Object.values(tilesets)) {
  for (let i = value.length - 1; i >= 0; i--) {
    const thisvalue = value[i]
    const actualWidth = ctx.measureText(thisvalue.emoji).width
    if (actualWidth !== idealWidth) removed.push(...value.splice(i, 1))
  }
}

if (removed.length > 0) {
  console.log(`Removed {${removed.map((r) => r.label)}}`)
}

const root = createRoot(document.getElementById('root'))
root.render(
  <HighScoresProvider>
    <App />
  </HighScoresProvider>,
)
