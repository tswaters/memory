import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import cx from 'classnames'

import Victory from './Victory'
import Header from './Header'
import Card from './Card'
import Menu from './Menu'
import { cardContainer, clickable } from '../../less/card'
import { container, initializing, won } from '../../less/container'
import { getHasWon } from '../redux'

const selector = createSelector(
  [
    state => state.cards,
    state => state.state === 'initializing',
    getHasWon,
    state => state.clickable
  ],
  (cards, init, hasWon, isClickable) => ({
    cards,
    init,
    hasWon,
    isClickable
  })
)

const Container = () => {
  const { cards, init, hasWon, isClickable } = useSelector(selector)
  return (
    <div className={cx(container, { [initializing]: init })}>
      <Victory />
      <Header />
      <Menu />
      <div
        className={cx(cardContainer, {
          [won]: hasWon,
          [clickable]: isClickable
        })}
      >
        {!init && cards.map(card => <Card key={card.index} card={card} />)}
      </div>
    </div>
  )
}

export default Container
