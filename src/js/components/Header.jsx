import React, { useCallback } from 'react'
import cx from 'classnames'
import { useSelector, useDispatch } from 'react-redux'

import { restart as restartClass } from '../../less/container'
import { button } from '../../less/button'
import { getStats, restart, initialize, getHasWon } from '../redux'

const Header = () => {
  const dispatch = useDispatch()
  const hasWon = useSelector(getHasWon)
  const { left, clicks, efficiency } = useSelector(getStats)

  const handleRestart = useCallback(() => {
    dispatch(restart())
    setTimeout(() => dispatch(initialize()), 500)
  }, [dispatch])

  const children = [
    hasWon ? 'You won!' : `Cards Left: ${left}`,
    `Clicks: ${clicks}`,
    `Efficiency: ${efficiency}%`
  ]

  return (
    <>
      <h1>{'Memory'}</h1>
      <h2>{children.join('; ')}</h2>
      {hasWon && (
        <button
          className={cx(button, restartClass)}
          onClick={() => handleRestart()}
        >
          {'🔄︎'}
        </button>
      )}
    </>
  )
}

export default Header
