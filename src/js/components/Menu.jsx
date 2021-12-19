import React, { useState, useCallback, useEffect } from 'react'
import { func, string, number } from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import cx from 'classnames'

import {
  initialize,
  restart,
  changeTotal,
  changeTileset,
  toggleDarkMode,
} from '../redux'

import { menu, open } from '../../less/menu'
import { button } from '../../less/button'
import { darkMode } from '../../less/colors'
import * as tilesets from '../../../var'

const Total = ({ total, onChange }) => (
  <label>
    {'total'}
    <input value={total} size="2" onChange={onChange} />
  </label>
)

Total.propTypes = {
  total: number.isRequired,
  onChange: func.isRequired,
}

const Tileset = ({ tileset, onChange }) => (
  <label>
    {'tileset'}
    <select value={tileset} onChange={onChange}>
      {Object.keys(tilesets).map((key) => (
        <option value={key} key={key}>
          {key}
        </option>
      ))}
    </select>
  </label>
)

const Close = ({ onClick }) => (
  <button
    className={cx(button)}
    onClick={onClick}
    title="Close Menu"
    aria-label="Close Menu"
  >
    {'❌︎'}
  </button>
)

const LightSwitch = () => {
  const dispatch = useDispatch()
  const darkModeOn = useSelector((state) => state.darkMode)
  const text = darkModeOn ? '🔆' : '🔅'
  useEffect(() => {
    document.body.classList.toggle(darkMode, darkModeOn)
  }, [darkModeOn])
  return (
    <button
      className={cx(button)}
      onClick={() => dispatch(toggleDarkMode())}
      title="Toggle Dark Mode"
      aria-label="Toggle Dark Mode"
    >
      {text}
    </button>
  )
}

Close.propTypes = {
  onClick: func.isRequired,
}

Tileset.propTypes = {
  tileset: string.isRequired,
  onChange: func.isRequired,
}

const Controls = () => {
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState(null)
  const [total, setTotal] = useState(useSelector((state) => state.total))
  const [tileset, setTileset] = useState(useSelector((state) => state.tileset))

  const handleRestart = useCallback(() => {
    dispatch(restart())
    setTimeout(() => {
      dispatch(changeTotal(total))
      dispatch(changeTileset(tileset))
      dispatch(initialize())
      setExpanded(null)
    }, 500)
  }, [dispatch, tileset, total])

  return (
    <div className={cx(menu, { [open]: expanded })}>
      {expanded === null && (
        <>
          <button
            className={cx(button)}
            onClick={() => setExpanded('menu')}
            title="Open Menu"
            aria-label="Open Menu"
          >
            {'☰︎'}
          </button>
          <button
            className={cx(button)}
            onClick={() => setExpanded('about')}
            title="About"
            aria-label="About"
          >
            {'❓︎'}
          </button>
          <LightSwitch />
        </>
      )}
      {expanded === 'about' && (
        <>
          {`Memory v${process.env.version}`}
          <Close onClick={() => setExpanded(null)} />
        </>
      )}
      {expanded === 'menu' && (
        <>
          <Total total={total} onChange={(e) => setTotal(e.target.value)} />
          <Tileset
            tileset={tileset}
            onChange={(e) => setTileset(e.target.value)}
          />
          <button
            onClick={handleRestart}
            className={cx(button)}
            title="Restart"
            arial-label="Restart"
          >
            {'🔄︎'}
          </button>
          <Close onClick={() => setExpanded(null)} />
        </>
      )}
    </div>
  )
}

export default Controls
