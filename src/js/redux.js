import {createSelector} from 'reselect'
import * as tilesets from '../../var'

const INITIALIZE = 'INITIALiZE'
const RESTART = 'RESTART'
const CHANGE_TOTAL = 'CHANGE_TOTAL'
const CHANGE_TILESET = 'CHANGE_TILESET'
const CHANGE_STATE = 'CHANGE_STATE'
const CLICK_CARD = 'CLICK_CARD'
const SELECT_CARD = 'SELECT_CARD'
const DESELECT_CARD = 'DESELECT_CARD'
const SUCCESS = 'SUCCESS'
const LOCK = 'LOCK'

const FLIP_TIMEOUT = 500

export const getStats = createSelector([
  state => state.cards.filter(card => card.finished),
  state => state.total,
  state => state.state,
  state => state.clicks
], (
  finished,
  total,
  state,
  clicks
) => ({
  left: total - finished.length,
  total,
  state,
  clicks,
  efficiency: parseInt(clicks === 0 ? 0 : finished.length / clicks * 100, 10)
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

  dispatch({type: CLICK_CARD})

  // if no card selected
  if (selected == null) {
    dispatch({type: SELECT_CARD, index})
    return
  }

  // match!
  if (cards[index].value === cards[selected].value) {

    dispatch({type: SUCCESS, index: selected})
    dispatch({type: SUCCESS, index})
    setTimeout(() => dispatch(unlockCards()), FLIP_TIMEOUT)

    const {left} = getStats(getState())
    if (left === 0) {
      setTimeout(() => dispatch({type: CHANGE_STATE, state: 'won'}), FLIP_TIMEOUT)
    }

  } else {

    // toggle the card
    dispatch({type: SELECT_CARD, index})
    setTimeout(() => dispatch(lockCards()))

    // wait a few seconds then untoggle both
    setTimeout(() => {
      dispatch({type: DESELECT_CARD, index})
      dispatch({type: DESELECT_CARD, index: selected})
      setTimeout(() => dispatch(unlockCards()), FLIP_TIMEOUT)
    }, FLIP_TIMEOUT)

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
  clickable: true,
  clicks: 0,
  total,
  tileset,
  cards: [/*{value, revealed, finished, index}*/]
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
        clicks: 0,
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

    case CLICK_CARD:
      return {
        ...state,
        clicks: state.clicks + 1
      }

    case SUCCESS:
      return {
        ...state,
        selected: null,
        cards: state.cards.map((card, index) => action.index !== index ? card : {...card, revealed: true, finished: true})
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
        clickable: action.clickable
      }

    default:
      return state
  }
}
