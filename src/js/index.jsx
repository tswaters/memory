
import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'

import configureStore from './store'
import App from './App'
import {initialize, changeTotal, changeTileset} from './redux'

import animals from '../../var/animals'

const store = configureStore()

render((
  <Provider store={store}>
    <App />
  </Provider>
), document.getElementById('root'))

let total = localStorage.getItem('total')
if (!total) total = 24
else { total = parseInt(total, 10) }

let tiles = localStorage.getItem('tileset_values')
if (!tiles) tiles = animals
else {tiles = JSON.parse(tiles) }

let tileset = localStorage.getItem('tileset_name')
if (!tileset) { tileset = 'animals' }

store.dispatch(changeTileset(tileset, tiles))
store.dispatch(changeTotal(total))
store.dispatch(initialize(animals, 2))
