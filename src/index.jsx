import { render } from 'react-dom'
import App from './App.jsx'
import { HighScoresProvider } from './HighScores.jsx'
import { darkMode, lightMode } from './index.css'
import * as tilesets from './data/index.js'

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

for (const [key, value] of Object.entries(tilesets)) {
  for (let i = value.length - 1; i >= 0; i--) {
    if (ctx.measureText(value[i].emoji).width !== idealWidth) {
      console.log(`removed ${value[i].emoji} from ${key}`)
      removed.push(...value.splice(i, 1))
    }
  }
}

if (removed.length > 0) {
  console.log(
    `Removed ${removed.length} glyphs with non-expected width (${idealWidth})`,
  )
}

render(
  <HighScoresProvider>
    <App />
  </HighScoresProvider>,
  document.getElementById('root'),
)
