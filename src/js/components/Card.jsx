import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { clickCard } from '../redux'
import { card, revealed, flipper, flip, front, back } from '../../less/card'

class Card extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    revealed: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    clickable: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.clickable === nextProps.clickable
  }

  handleClick() {
    if (this.props.revealed || !this.props.clickable) {
      return
    }
    this.props.handleClick(this.props.index)
  }

  render() {
    const classes = cx(card, {
      [revealed]: this.props.revealed,
      [flip]: this.props.revealed
    })
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

const selector = createSelector(
  [(state, ownProps) => state.cards[ownProps.index], state => state.clickable],
  (_card, clickable) => ({
    value: _card.value,
    revealed: _card.revealed,
    clickable
  })
)

const mapStateToProps = (state, ownProps) => selector(state, ownProps)

const mapDispatchToProps = dispatch => ({
  handleClick: index => dispatch(clickCard(index))
})

export default connect(mapStateToProps, mapDispatchToProps)(Card)
