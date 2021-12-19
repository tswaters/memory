const fs = require('fs')
const path = require('path')

const things = fs
  .readdirSync(path.join(__dirname))
  .filter((thing) => thing.endsWith('.txt') && thing !== 'emoji-data.txt')

things.forEach((_thing) => {
  const thing = path.basename(_thing, '.txt')

  const data = fs
    .readFileSync(path.join(__dirname, `${thing}.txt`))
    .toString()
    .split('\n')
    .filter((x) => x !== '')
    .map((x) => parseInt(`0x${x.split(';')[0].trim()}`, 16))
    .map(toUTF16Pair)

  fs.writeFileSync(
    path.join(__dirname, `./${thing}.json`),
    `["${data.join('","')}"]`
  )
})

fs.writeFileSync(
  path.join(__dirname, 'index.js'),
  things
    .map(
      (thing) =>
        `export {default as ${path.basename(
          thing,
          '.txt'
        )}} from './${path.basename(thing, '.txt')}'`
    )
    .join('\n')
)

function toUTF16Pair(x) {
  if (x < 0x10000) {
    return `\\u${x.toString(16)}`
  }
  const first = Math.floor((x - 0x10000) / 0x400) + 0xd800
  const second = ((x - 0x10000) % 0x400) + 0xdc00
  return `\\u${first.toString(16)}\\u${second.toString(16)}`
}
