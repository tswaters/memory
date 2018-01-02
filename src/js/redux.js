import {createSelector} from 'reselect'

const INITIALIZE = 'INITIALiZE'
const CHANGE_TOTAL = 'CHANGE_TOTAL'
const CHANGE_TILESET = 'CHANGE_TILESET'
const CHANGE_STATE = 'CHANGE_STATE'
const SELECT_CARD = 'SELECT_CARD'
const DESELECT_CARD = 'DESELECT_CARD'
const SUCCESS = 'SUCCESS'

export const getStats = createSelector([
  state => state.cards.filter(card => card.clickable),
  state => state.total,
  state => state.state
], (
  clickable,
  total,
  state
) => ({
  clickable,
  total,
  state
}))

export const initialize = () => (dispatch, getState) => {
  const {total, tiles} = getState()
  let available = new Set()
  const seen = new Set()
  const cards = []

  // pick random tiles from tileset, total / 2; convert to array
  do { available.add(tiles[Math.floor(Math.random() * tiles.length)]) }
  while (available.size < total / 2)
  available = [...available]

  // place 2 of each of these files randomly in an array
  // pick a random index, if we've seen it remove from array
  do {
    const index = Math.floor(Math.random() * tiles.length)
    const value = tiles[index]
    if (seen.has(value)) { tiles.splice(index, 1) }
    seen.add(value)
    cards.push({
      value,
      index: cards.length,
      clickable: true,
      revealed: false
    })
  } while (cards.length < total)

  dispatch({
    type: INITIALIZE,
    total,
    cards
  })
}

export const changeTotal = total => dispatch => {
  localStorage.setItem('total', total)
  dispatch({type: CHANGE_TOTAL, total})
}

export const changeTileset = (name, tileset) => dispatch => {
  localStorage.setItem('tileset_values', JSON.stringify(tileset))
  localStorage.setItem('tileset_name', name)
  dispatch({type: CHANGE_TILESET, tileset, name})
}

export const clickCard = index => (dispatch, getState) => {

  const {selected, cards} = getState()

  // if no card selected
  if (selected == null) {
    return dispatch({type: SELECT_CARD, index})
  }

  // match!
  if (cards[index].value === cards[selected].value) {

    dispatch({type: SUCCESS, index: selected})
    dispatch({type: SUCCESS, index})

    if (getStats(getState()).clickable.length === 0) {
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
    }, 500)

  }
}

const initialState = {
  state: 'initializing',
  total: null,
  selected: null,
  tiles: null,
  tileset: null,
  cards: [/*{value, clickable, revealed, index}*/]
}

export default (state = initialState, action) => {
  switch (action.type) {

    case CHANGE_TILESET:
      return {
        ...state,
        tileset: action.name,
        tiles: action.tileset
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
    case CHANGE_STATE:
      return {
        ...state,
        state: action.state
      }

    case SUCCESS:
      return {
        ...state,
        selected: null,
        cards: state.cards.map((card, index) => action.index !== index ? card : {...card, revealed: true, clickable: false})
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

    default:
      return state
  }
}
