
import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'

import configureStore from './store'
import App from './App'
import {initialize} from './redux'

const store = configureStore()

render((
  <Provider store={store}>
    <App />
  </Provider>
), document.getElementById('root'))

store.dispatch(initialize())
