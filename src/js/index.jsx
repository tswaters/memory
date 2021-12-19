import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import '../less/colors'
import Container from './components/Container'
import configureStore from './store'
import { initialize } from './redux'
import * as offline from '@lcdp/offline-plugin/runtime'

offline.install({
  onUpdateReady() {
    offline.applyUpdate()
  },
  onUpdated() {
    window.location.reload()
  },
})

const store = configureStore()
store.dispatch(initialize())

render(
  <Provider store={store}>
    <Container />
  </Provider>,
  document.getElementById('root')
)
