
import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'

import Container from './components/Container'
import configureStore from './store'
import {initialize} from './redux'
import * as offline  from 'offline-plugin/runtime'

offline.install()

const store = configureStore()
store.dispatch(initialize())

render((
  <Provider store={store}>
    <Container />
  </Provider>
), document.getElementById('root'))
