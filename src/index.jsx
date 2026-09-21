import { render } from 'react-dom'
import App from './App.jsx'
import { darkMode, lightMode } from './index.css'

const theme = window.localStorage.getItem('THEME')
if (theme) document.body.classList.add(theme === 'DARK' ? darkMode : lightMode)

render(<App />, document.getElementById('root'))
