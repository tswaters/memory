import { memo, Fragment } from 'react'

import * as tilesets from './data/index'

export default memo(function DebugTileDisplay() {
  return (
    <dl>
      {Object.entries(tilesets).map(([label, data]) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>
            {data.map((item) => (
              <span key={item.emoji} title={item.label}>
                {item.emoji}
              </span>
            ))}
          </dd>
        </Fragment>
      ))}
    </dl>
  )
})
