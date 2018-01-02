
import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

import {restart as restartClass} from '../less/container'
import {button} from '../less/button'
import {getStats, restart, initialize} from '../redux'

class Header extends PureComponent {

  static propTypes = {
    left: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    handleRestart: PropTypes.func.isRequired
  }

  render () {
    const children = []
    if (this.props.state === 'won') {
      children.push('You won!')
    } else {
      children.push(`Cards Left: ${this.props.left}`)
    }

    return [
      <h1 key="header">
        {'Memory'}
      </h1>,
      <h2 key="stats">
        {children}
      </h2>,
      this.props.state === 'won' ? (
        <div className={cx(button, restartClass)} onClick={this.props.handleRestart} key="restart">{'🔄'}</div>
      ) : null
    ]
  }
}

const selector = createSelector(getStats, stats => ({
  left: stats.left,
  state: stats.state
}))

const mapStateToProps = state => selector(state)

const mapDispatchToProps = dispatch => ({
  handleRestart: () => {
    dispatch(restart())
    setTimeout(() => dispatch(initialize()), 500)
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Header)
