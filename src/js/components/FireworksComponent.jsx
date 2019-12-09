import React, { PureComponent } from 'react'
import cx from 'classnames'
import Fireworks from 'fireworks-canvas'

import { fireworks } from '../../less/fireworks'

class FireworksComponent extends PureComponent {
  componentDidMount() {
    this.fireworks = new Fireworks(this.container)
    this.fireworks.start()
  }

  componentWillUnmount() {
    this.fireworks.stop()
  }

  render() {
    return (
      <div className={cx(fireworks)} ref={_ref => (this.container = _ref)} />
    )
  }
}

export default FireworksComponent
