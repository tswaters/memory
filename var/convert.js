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
    .map((x) => {
      const [, emoji] = /\((.+?)\)/g.exec(x)
      const [, label] = /\) (.*)$/g.exec(x)
      return { emoji, label }
    })

  fs.writeFileSync(
    path.join(__dirname, `./${thing}.json`),
    JSON.stringify(data)
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
