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
    initializing: PropTypes.bool.isRequired
  }

  render () {
    const cards = []

    if (!this.props.initializing) {
      for (let x = 0; x < this.props.total; x++) {
        cards.push(<Card key={x} index={x} />)
      }
    }

    return (
      <div className={cx(container, {[initializing]: this.props.initializing})}>
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
  state => state.total,
  state => state.state === 'initializing'
], (
  total,
  initializing
) => ({
  total,
  initializing
}))

const mapStateToProps = state => selector(state)
const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(Container)
