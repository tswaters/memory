import React, { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import Fireworks from 'fireworks-canvas'

import { getHasWon } from '../redux'
import { fireworks } from '../../less/fireworks'

const Victory = () => {
  const hasWon = useSelector(getHasWon)
  const ref = useRef(null)

  useEffect(() => {
    if (!hasWon) return

    const fireworks = new Fireworks(ref.current)
    fireworks.start()

    const handler = (e) => e.keyCode === 27 && fireworks.stop()
    document.addEventListener('keydown', handler)

    return () => {
      fireworks.kill()
      window.removeEventListener('keydown', handler)
    }
  }, [hasWon])

  if (!hasWon) return null
  return <div className={cx(fireworks)} ref={ref} />
}

export default Victory
