
import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import cx from 'classnames'

import {createSelector} from 'reselect'
import {initialize, restart, changeTotal, changeTileset} from '../redux'

import {menu, open, close} from '../less/menu'
import {button} from '../less/button'
import * as tilesets from '../../../var'

class Menu extends PureComponent {

  static propTypes = {
    total: PropTypes.number.isRequired,
    tileset: PropTypes.string.isRequired,
    handleChangeTotal: PropTypes.func.isRequired,
    handleChangeTileset: PropTypes.func.isRequired,
    initialize: PropTypes.func.isRequired,
    restart: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.handleChangeTotal = this.handleChangeTotal.bind(this)
    this.handleChangeTileset = this.handleChangeTileset.bind(this)
    this.handleRestart = this.handleRestart.bind(this)
    this.state = {
      expanded: false,
      total: props.total,
      tileset: props.tileset
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.total !== nextProps.total || this.props.tileset !== nextProps.tileset) {
      this.setState({
        total: nextProps.total,
        tileset: nextProps.tileset
      })
    }
  }

  handleChangeTotal (e) {
    this.setState({total: parseInt(e.target.value, 10)})
  }

  handleChangeTileset (e) {
    this.setState({tileset: e.target.value})
  }

  handleRestart () {
    this.props.restart()
    setTimeout(() => {
      this.props.handleChangeTotal(this.state.total)
      this.props.handleChangeTileset(this.state.tileset)
      this.props.initialize()
      this.setState({expanded: false})
    }, 500)
  }

  handleClick () {
    this.setState({expanded: !this.state.expanded})
  }

  render () {

    const children = []

    if (this.state.expanded) {
      children.push(
        <label key="tileset">
          {'tileset'}
          <select value={this.state.tileset} onChange={this.handleChangeTileset}>
            {Object.keys(tilesets).map(key => (
              <option value={key} key={key}>
                {key}
              </option>
            ))}
          </select>
        </label>,
        <label key="tiles">
          {'total'}
          <input value={this.state.total} size="2" onChange={this.handleChangeTotal} />
        </label>,
        <div
          key="restart"
          onClick={this.handleRestart}
          className={cx(button)}
          arial-label="Restart">
          {'🔄'}
        </div>,
        <div
          key="close"
          className={cx(button, close)}
          onClick={this.handleClick}
          aria-label="Close Menu">
          {'❌'}
        </div>
      )
    } else {
      children.push(
        <div
          key="open"
          className={cx(button)}
          onClick={this.handleClick}
          aria-label="Open Menu">
          {'☰'}
        </div>
      )
    }

    return (
      <div className={cx(menu, {[open]: this.state.expanded})}>
        {children}
      </div>
    )
  }
}

const selector = createSelector([
  state => state.total,
  state => state.tileset
], (
  total,
  tileset
) => ({
  total,
  tileset
}))

const mapStateToProps = state => selector(state)

const mapDispatchToProps = dispatch => ({
  restart: () => dispatch(restart()),
  initialize: () => dispatch(initialize()),
  handleChangeTotal: total => dispatch(changeTotal(total)),
  handleChangeTileset: (tileset, tiles) => dispatch(changeTileset(tileset, tiles))
})

export default connect(mapStateToProps, mapDispatchToProps)(Menu)
