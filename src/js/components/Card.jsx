
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import PropTypes from 'prop-types'
import cx from 'classnames'

import {clickCard} from '../redux'
import {card, clickable, flipper, flip, front, back} from '../../less/card'

class Card extends PureComponent {

  static propTypes = {
    value: PropTypes.string.isRequired,
    revealed: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    clickable: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick () {
    if (this.props.revealed || !this.props.clickable) {
      return
    }
    this.props.handleClick(this.props.index)
  }

  render () {
    const classes = cx(card, {
      [clickable]: this.props.clickable,
      [flip]: this.props.revealed}
    )

    return (
      <div onClick={this.handleClick} className={classes}>
        <div className={cx(flipper)}>
          <div className={cx(front)}></div>
          <div className={cx(back)}>{this.props.value}</div>
        </div>
      </div>
    )
  }
}

const selector = createSelector([
  (state, ownProps) => state.cards[ownProps.index]
], _card => ({
  value: _card.value,
  revealed: _card.revealed,
  clickable: _card.clickable
}))

const mapStateToProps = (state, ownProps) => selector(state, ownProps)

const mapDispatchToProps = dispatch => ({
  handleClick: index => dispatch(clickCard(index))
})

export default connect(mapStateToProps, mapDispatchToProps)(Card)
