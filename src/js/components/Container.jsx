import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
import cx from 'classnames'

import FireworksComponent from './FireworksComponent'
import Header from './Header'
import Card from './Card'
import Menu from './Menu'
import {cardContainer, clickable} from '../../less/card'
import {container, initializing, won} from '../../less/container'

class Container extends Component {

  static propTypes = {
    total: PropTypes.number.isRequired,
    init: PropTypes.bool.isRequired,
    clickable: PropTypes.bool.isRequired,
    won: PropTypes.bool.isRequired
  }

  shouldComponentUpdate (nextProps) {
    return this.props.clickable === nextProps.clickable
  }

  componentWillReceiveProps (nextProps) {
    this.ref.classList.toggle(clickable, nextProps.clickable)
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
        {this.props.won && <FireworksComponent active={this.props.won} />}
        <Header />
        <Menu />
        <div
          ref={_ref => this.ref = _ref}
          className={cx(cardContainer, {
            [won]: this.props.won,
            [clickable]: this.props.clickable
          })}>
          {cards}
        </div>
      </div>
    )
  }
}

const selector = createSelector([
  state => state.cards.length,
  state => state.state === 'initializing',
  state => state.state === 'won',
  state => state.clickable
], (
  total,
  init,
  won,
  clickable
) => ({
  total,
  init,
  won,
  clickable
}))

const mapStateToProps = state => selector(state)

export default connect(mapStateToProps)(Container)
