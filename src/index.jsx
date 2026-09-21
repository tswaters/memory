import { render } from 'react-dom'
import App from './App.jsx'
import { HighScoresProvider } from './HighScores.jsx'
import { darkMode, lightMode } from './index.css'

const theme = window.localStorage.getItem('THEME')
if (theme) document.body.classList.add(theme === 'DARK' ? darkMode : lightMode)

render(
  <HighScoresProvider>
    <App />
  </HighScoresProvider>,
  document.getElementById('root'),
)
