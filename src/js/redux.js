import {createSelector} from 'reselect'
import * as tilesets from '../../var'

const INITIALIZE = 'INITIALiZE'
const RESTART = 'RESTART'
const CHANGE_TOTAL = 'CHANGE_TOTAL'
const CHANGE_TILESET = 'CHANGE_TILESET'
const CHANGE_STATE = 'CHANGE_STATE'
const SELECT_CARD = 'SELECT_CARD'
const DESELECT_CARD = 'DESELECT_CARD'
const SUCCESS = 'SUCCESS'
const LOCK = 'LOCK'

export const getStats = createSelector([
  state => state.cards.filter(card => card.finished),
  state => state.total,
  state => state.state
], (
  finished,
  total,
  state
) => ({
  left: total - finished.length,
  total,
  state
}))

export const initialize = () => (dispatch, getState) => {
  const {total, tileset} = getState()
  const tiles = tilesets[tileset]
  let available = new Set()
  const seen = new Set()
  const cards = []

// todo: show error to user on form
  if (tiles.length < total / 2) {
    throw new Error('not enough!')
  }

  // pick random tiles from tileset, total / 2; convert to array
  do { available.add(tiles[Math.floor(Math.random() * tiles.length)]) }
  while (available.size < total / 2)
  available = [...available]

  // place 2 of each of these files randomly in an array
  // pick a random index, if we've seen it remove from array
  do {
    const index = Math.floor(Math.random() * available.length)
    const value = available[index]
    if (seen.has(value)) { available.splice(index, 1) }
    seen.add(value)
    cards.push({
      value,
      index: cards.length,
      clickable: true,
      revealed: false,
      finished: false
    })
  } while (cards.length < total)

  dispatch({
    type: INITIALIZE,
    total,
    cards
  })
}

export const restart = () => ({
  type: RESTART
})

export const changeTotal = total => dispatch => {
  localStorage.setItem('total', total)
  dispatch({type: CHANGE_TOTAL, total})
}

export const changeTileset = name => dispatch => {
  localStorage.setItem('tileset', name)
  dispatch({type: CHANGE_TILESET, name})
}

export const lockCards = () => ({type: LOCK, clickable: false})

export const unlockCards = () => ({type: LOCK, clickable: true})

export const clickCard = index => (dispatch, getState) => {

  const {selected, cards} = getState()

  dispatch(lockCards())

  // if no card selected
  if (selected == null) {
    dispatch({type: SELECT_CARD, index})
    setTimeout(() => dispatch(unlockCards()), 500)
    return
  }

  // match!
  if (cards[index].value === cards[selected].value) {

    dispatch({type: SUCCESS, index: selected})
    dispatch({type: SUCCESS, index})
    setTimeout(() => dispatch(unlockCards()), 500)

    const {left} = getStats(getState())
    if (left === 0) {
      setTimeout(() => {
        dispatch({type: CHANGE_STATE, state: 'won'})
      }, 500)
    }

  } else {

    // toggle the card
    dispatch({type: SELECT_CARD, index})

    // wait a few seconds then untoggle both
    setTimeout(() => {
      dispatch({type: DESELECT_CARD, index})
      dispatch({type: DESELECT_CARD, index: selected})
      setTimeout(() => dispatch(unlockCards()), 500)
    }, 500)

  }
}

let total = localStorage.getItem('total')
if (!total) total = 24
else { total = parseInt(total, 10) }

let tileset = localStorage.getItem('tileset')
if (!tileset) { tileset = 'animals' }

const initialState = {
  state: 'initializing',
  selected: null,
  total,
  tileset,
  cards: [/*{value, clickable, revealed, finished, index}*/]
}

export default (state = initialState, action) => {
  switch (action.type) {

    case CHANGE_TILESET:
      return {
        ...state,
        tileset: action.name
      }

    case CHANGE_TOTAL:
      return {
        ...state,
        total: action.total
      }

    case INITIALIZE:
      return {
        ...state,
        state: 'started',
        selected: null,
        total: action.total,
        cards: action.cards
      }

    case RESTART:
      return {
        ...state,
        selected: null,
        cards: state.cards.map(card => ({...card, revealed: false}))
      }

    case CHANGE_STATE:
      return {
        ...state,
        state: action.state
      }

    case SUCCESS:
      return {
        ...state,
        selected: null,
        cards: state.cards.map((card, index) => action.index !== index ? card : {...card, revealed: true, finished: true, clickable: false})
      }

    case SELECT_CARD:
      return {
        ...state,
        selected: action.index,
        cards: state.cards.map((card, index) => action.index !== index ? card : {...card, revealed: true})
      }

    case DESELECT_CARD:
      return {
        ...state,
        selected: null,
        cards: state.cards.map((card, index) => action.index !== index ? card : {...card, revealed: false})
      }

    case LOCK:
      return {
        ...state,
        cards: state.cards.map(card => ({...card, clickable: action.clickable}))
      }

    default:
      return state
  }
}
