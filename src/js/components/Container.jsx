import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import cx from 'classnames'

import Header from './Header'
import Card from './Card'
import Menu from './Menu'
import {cardContainer} from '../less/card'
import {container, initializing} from '../less/container'

class Container extends PureComponent {

  static propTypes = {
    total: PropTypes.number.isRequired,
    init: PropTypes.bool.isRequired
  }

  render () {
    const cards = []

    if (!this.props.init) {
      for (let x = 0; x < this.props.total; x++) {
        cards.push(<Card key={x} index={x} />)
      }
    }

    return (
      <div className={cx(container, {[initializing]: this.props.init})}>
        <Header />
        <Menu />
        <div className={cx(cardContainer)}>
          {cards}
        </div>
      </div>
    )
  }
}

const selector = createSelector([
  state => state.cards.length,
  state => state.state === 'initializing'
], (
  total,
  init
) => ({
  total,
  init
}))

const mapStateToProps = state => selector(state)

export default connect(mapStateToProps)(Container)
