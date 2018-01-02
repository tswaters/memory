
import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import {getStats} from '../redux'

class Header extends PureComponent {

  static propTypes = {
    left: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired
  }

  render () {
    return [
      <h1 key="header">
        {'Memory'}
      </h1>,
      <h2 key="stats">
        {this.props.state === 'won'
          ? ['You won!', <button key="restart">{'Play Again'}</button>]
          : `Cards Left: ${this.props.left}`
        }
      </h2>
    ]
  }
}

const selector = createSelector(getStats, stats => ({
  left: stats.clickable.length,
  state: stats.state
}))

const mapStateToProps = state => selector(state)

export default connect(mapStateToProps)(Header)
