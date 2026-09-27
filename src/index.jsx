import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { HighScoresProvider } from './HighScores.jsx'
import { darkMode, lightMode } from './index.css'
import * as tilesets from './data/index.js'

if (window.OFFLINE_PLUGIN_ENABLED) {
  navigator.serviceWorker?.register?.('sw.js', {})
}

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

let total = 0
const logTable = {}

for (const [key, value] of Object.entries(tilesets)) {
  for (let i = value.length - 1; i >= 0; i--) {
    const thisvalue = value[i]
    const actualWidth = ctx.measureText(thisvalue.emoji).width
    if (actualWidth !== idealWidth) {
      const [entry] = value.splice(i, 1)
      removed.push(entry)
      console.log('Removed', entry)
    } else {
      total++
    }
  }

  logTable[key] = value.length
}

if (removed.length > 0) {
  console.log(`Removed ${removed.length}`)
}

logTable.total = total

console.table(logTable)

const root = createRoot(document.getElementById('root'))
root.render(
  <HighScoresProvider>
    <App />
  </HighScoresProvider>,
)
