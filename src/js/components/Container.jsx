import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import cx from 'classnames'

import Banner from './Banner'
import Victory from './Victory'
import Header from './Header'
import Card from './Card'
import Menu from './Menu'
import { cardContainer, clickable } from '../../less/card'
import { container, initializing, won } from '../../less/container'
import { darkMode, lightMode } from '../../less/colors'
import { getHasWon } from '../redux'

const selector = createSelector(
  [
    (state) => state.cards,
    (state) => state.state === 'initializing',
    getHasWon,
    (state) => state.clickable,
    (state) => state.darkMode === true,
  ],
  (cards, init, hasWon, isClickable, isDarkMode) => ({
    cards,
    init,
    hasWon,
    isClickable,
    isDarkMode,
  })
)

const Container = () => {
  const { cards, init, hasWon, isClickable, isDarkMode } = useSelector(selector)
  return (
    <>
      <Banner />
      <div
        className={cx(container, {
          [darkMode]: isDarkMode,
          [lightMode]: !isDarkMode,
          [initializing]: init,
        })}
      >
        <Victory />
        <Header />
        <Menu />
        <div
          className={cx(cardContainer, {
            [won]: hasWon,
            [clickable]: isClickable,
          })}
        >
          {!init && cards.map((card) => <Card key={card.index} card={card} />)}
        </div>
      </div>
    </>
  )
}

export default Container
