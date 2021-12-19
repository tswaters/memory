import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { shape, string, bool } from 'prop-types'
import cx from 'classnames'

import { clickCard } from '../redux'
import { card, revealed, flipper, flip, front, back } from '../../less/card'

const propTypes = {
  card: shape({
    label: string.isRequired,
    emoji: string.isRequired,
    revealed: bool.isRequired,
  }).isRequired,
}

const Card = ({ card: { index, label, emoji, revealed: isRevealed } }) => {
  const dispatch = useDispatch()
  const clickable = useSelector((state) => state.clickable)
  const handleClick = useCallback(
    () => !isRevealed && clickable && dispatch(clickCard(index)),
    [index, isRevealed, clickable, dispatch]
  )

  return (
    <div
      title={isRevealed ? label : 'Blank Card'}
      arial-label={isRevealed ? label : 'Blank Card'}
      onClick={handleClick}
      className={cx(card, {
        [revealed]: isRevealed,
        [flip]: isRevealed,
      })}
    >
      <div className={cx(flipper)}>
        <div className={cx(front)}></div>
        <div className={cx(back)}>{emoji}</div>
      </div>
    </div>
  )
}

Card.propTypes = propTypes

export default Card
