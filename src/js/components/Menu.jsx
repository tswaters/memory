
import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import cx from 'classnames'

import {createSelector} from 'reselect'
import {initialize, changeTotal, changeTileset} from '../redux'

import {menu, open, button, close} from '../less/menu'
import * as tilesets from '../../../var'

class Menu extends PureComponent {

  static propTypes = {
    total: PropTypes.number.isRequired,
    tileset: PropTypes.string.isRequired,
    handleChangeTotal: PropTypes.func.isRequired,
    handleChangeTileset: PropTypes.func.isRequired,
    initialize: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.handleChangeTotal = this.handleChangeTotal.bind(this)
    this.handleChangeTileset = this.handleChangeTileset.bind(this)
    this.handleRestart = this.handleRestart.bind(this)
    this.state = {
      expanded: false
    }
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      total: nextProps.total,
      tileset: nextProps.tileset
    })
  }

  handleChangeTotal (e) {
    this.setState({total: e.target.value})
  }

  handleChangeTileset (e) {
    this.setState({tileset: e.target.value})
  }

  handleRestart () {
    this.props.handleChangeTotal(this.state.total)
    this.props.handleChangeTileset(this.state.tileset, tilesets[this.state.tileset])
    this.props.initialize()
    this.setState({expanded: false})
  }

  handleClick (e) {
    e.preventDefault()
    this.setState({expanded: !this.state.expanded})
  }

  getOpen () {
    const items = Object.keys(tilesets).map(key => {
      return (
        <option value={key} key={key}>
          {key}
        </option>
      )
    })

    return [
      <label key="tileset">
        {'tileset'}
        <select value={this.state.tileset} onChange={this.handleChangeTileset}>
          {items}
        </select>
      </label>,
      <label key="tiles">
        {'total'}
        <input value={this.state.total} size="2" onChange={this.handleChangeTotal} />
      </label>,
      <div key="restart" onClick={this.handleRestart} className={cx(button)}>
        {'🔄'}
      </div>,
      <div key="close" className={cx(button, close)} onClick={this.handleClick}>
        {'❌'}
      </div>
    ]
  }

  getClosed () {
    return (
      <div className={cx(button)} onClick={this.handleClick}>
        {'☰'}
      </div>
    )
  }

  render () {
    return (
      <div className={cx(menu, {[open]: this.state.expanded})}>
        {
          this.state.expanded
            ? this.getOpen()
            : this.getClosed()
        }
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
  initialize: () => dispatch(initialize()),
  handleChangeTotal: total => dispatch(changeTotal(total)),
  handleChangeTileset: (tileset, tiles) => dispatch(changeTileset(tileset, tiles))
})

export default connect(mapStateToProps, mapDispatchToProps)(Menu)
