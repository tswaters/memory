import { memo, Fragment } from 'react'

import * as tilesets from './data/index'

function DebugTileDisply() {
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
}

export const DebugTileDisplay = memo(DebugTileDisply)
