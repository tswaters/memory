import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const things = (await fs.readdir(path.join(__dirname, 'data')))
  .filter((thing) => thing.endsWith('.txt') && thing !== 'emoji-test.txt')
  .map((fname) => path.join(__dirname, 'data', fname))

const outputPath = path.join(__dirname, '../src/data')

const data = {} // raw emoji data, flat as needed (simple ones are easy)

for (const _thing of things) {
  const thing = path.basename(_thing, '.txt')

  const lines = await fs.readFile(_thing, 'utf-8')

  const matches = lines
    .split('\n')
    .filter((x) => x !== '')
    .map((x) => /# (.+?) E[0-9.]+ (.+?)$/g.exec(x))
    .filter(Boolean)

  data[thing] = matches.map(([, emoji, label]) => {
    return { emoji, label: label.replace('flag: ', '') }
  })
}

const outputs = {}

// some of thee are really simple

;['faces', 'flags', 'food', 'plants', 'animals'].forEach((thing) => {
  outputs[thing] = data[thing]
})

// others will require more processing with ZWJ combinations
// unfortunately below lies dragons, it's kind of messy and brittle with legacy handling
// like, someone tell me why cops doesn't use police car modifier?!
//
//
// note, javascript supports using these unicode characters as keys here
// but vscode shows a blank square (weird), so specifying keys in \u{} format

const skintones = {
  '\u{1F3FB}': 'light skin',
  '\u{1F3FC}': 'medium light skin',
  '\u{1F3FD}': 'medium skin',
  '\u{1F3FE}': 'medium dark skin',
  '\u{1F3FF}': 'dark skin',
}

const directions = {
  '\u{27A1}': 'right',
}

// this manWoman map can/should also include "person", \u{1F467}
// but listing all three usually has a slight hair difference between man/person
// not enough difference for memory

const manWoman = {
  '\u{1F468}': 'man',
  '\u{1F469}': 'woman',
  //'\u{1F9D1}': 'person',
}

// transgender is listed for competions sake, in practice it doesn't work anywhere
// cases where it *might* instead use un-qualified gender to mean "person"
// it's actually only used with the trans flag (which is already encoded as part of flags)

const gendersSigns = {
  '\u{2640}': 'female',
  '\u{2642}': 'male',
  // '\u{26A7}': 'transgender',
}

const doesNotSupportSkintone = ['zombie', 'genie']

const doesNotSupportsGender = [
  'ninja',
  'person with crown',
  'prince',
  'princess',
  'person with skullcap',
  'woman with headscarf',
  'woman dancing',
  'man dancing',
  'horse racing',
  'snowboarder',
  'person taking bath',
  'person in bed',
]

// these all support skin tone & gender in practice
const supportsDirection = [
  'person walking',
  'person kneeling',
  'white cane',
  'motorized wheelchair',
  'manual wheelchair',
  'person running',
]

// the hand gestures can support multiple skin tones

outputs.hands = data.hands.reduce((memo, entry) => {
  Object.entries(skintones).forEach(([skincode, skinlabel]) => {
    memo.push({
      emoji: `${entry.emoji}\u200D${skincode}`,
      label: `${entry.label} ${skinlabel}`,
    })
  })
  return memo
}, [])

outputs.people = []

// the base support {thing}{skintone}{zwj}{modifier}
//
// 1F9D1 1F3FC 200D 1F9B1                                 ; fully-qualified     # 🧑🏼‍🦱 E12.1 person: medium-light skin tone, curly hair

outputs.people.push(
  ...data.people_base.reduce((memo, entry) => {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      memo.push({
        emoji: `${entry.emoji}${skincode}`,
        label: `${entry.label} (${skinlabel})`,
      })
    })
    return memo
  }, []),
)

// the gestures support {gesture}{zwj}{skin}{zwj}{gender}

outputs.people.push(
  ...data.people_gesture.reduce((memo, entry) => {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
        memo.push({
          emoji: `${entry.emoji}\u200D${skincode}\u200D${gendercode}`,
          label: `${genderlabel} ${entry.label} (${skinlabel})`,
        })
      })
    })
    return memo
  }, []),
)

// the roles_1 support {gender}{zwj}{thing}{zwj}{skin}

// 1F468 1F3FC 200D 1F9AF 200D 27A1                       ; minimally-qualified # 👨🏼‍🦯‍➡ E15.1 man with white cane facing right: medium-light skin tone

outputs.people.push(
  ...data.people_modifiers.reduce((memo, entry) => {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      Object.entries(manWoman).forEach(([gendercode, genderlabel]) => {
        memo.push({
          emoji: `${gendercode}${skincode}\u200D${entry.emoji}`,
          label: `${genderlabel} ${entry.label} (${skinlabel})`,
        })
        if (supportsDirection.includes(entry.label)) {
          Object.entries(directions).forEach(([dircode, dirlabel]) => {
            memo.push({
              emoji: `${gendercode}${skincode}\u200D${entry.emoji}\u200D${dircode}`,
              label: `${genderlabel} ${entry.label} facing ${dirlabel} (${skinlabel})`,
            })
          })
        }
      })
    })
    return memo
  }, []),
)

// the roles_2 support {thing}{skin}{zwj}{gender_code}

outputs.people.push(
  ...data.people_roles
    .filter((x) => {
      return doesNotSupportSkintone.includes(x.label)
    })
    .reduce((memo, entry) => {
      Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
        memo.push({
          emoji: `${entry.emoji}\u200D${gendercode}`,
          label: `${genderlabel} ${entry.label}`,
        })
      })
      return memo
    }, []),
)

outputs.people.push(
  ...data.people_roles
    .filter((x) => doesNotSupportsGender.includes(x.label))
    .reduce((memo, entry) => {
      Object.entries(skintones).forEach(([skincode, skinlabel]) => {
        memo.push({
          emoji: `${entry.emoji}${skincode}\u200D`,
          label: `${entry.label} (${skinlabel})`,
        })
      })
      return memo
    }, []),
)

// 1F6B6 1F3FE 200D 2640 FE0F 200D 27A1                   ; minimally-qualified # 🚶🏾‍♀️‍➡ E15.1 woman walking facing right: medium-dark skin tone

outputs.people.push(
  ...data.people_roles
    .filter((x) => supportsDirection.includes(x.label))
    .reduce((memo, entry) => {
      Object.entries(skintones).forEach(([skincode, skinlabel]) => {
        Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
          Object.entries(directions).forEach(([dircode, dirlabel]) => {
            memo.push(
              {
                emoji: `${entry.emoji}${skincode}\u200D${gendercode}`,
                label: `${entry.label} ${genderlabel} (${skinlabel})`,
              },
              {
                emoji: `${entry.emoji}${skincode}\u200D${gendercode}\u200D${dircode}`,
                label: `${entry.label} ${genderlabel} ${dirlabel} (${skinlabel})`,
              },
            )
          })
        })
      })
      return memo
    }, []),
)

outputs.people.push(
  ...data.people_roles
    .filter(
      (x) =>
        !doesNotSupportsGender.includes(x.label) &&
        !doesNotSupportSkintone.includes(x.label) &&
        !supportsDirection.includes(x.label),
    )
    .reduce((memo, entry) => {
      Object.entries(skintones).forEach(([skincode, skinlabel]) => {
        Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
          memo.push({
            emoji: `${entry.emoji}${skincode}\u200D${gendercode}`,
            label: `${entry.label} ${genderlabel} (${skinlabel})`,
          })
        })
      })
      return memo
    }, []),
)

// no modifiers for some of these (it's just zombie)

outputs.people.push(...data.people_others)

// with all the outputs defined, spit out json files & an index file

const exports = []

for (const [thing, newData] of Object.entries(outputs)) {
  exports.push(
    `export {default as ${thing}} from './${path.basename(thing, '.txt')}'`,
  )

  // ones last sweep, apply fe0f to everything
  newData.forEach((x) => (x.emoji = `${x.emoji}\u{fe0f}`))

  await fs.writeFile(
    path.join(outputPath, `${thing}.json`),
    JSON.stringify(newData, null, 4),
  )

  process.stdout.write(`wrote ${path.join(outputPath, `${thing}.json`)}'\n`)
}

process.stdout.write(`wrote ${path.join(outputPath, 'index.js')}'\n`)
await fs.writeFile(path.join(outputPath, 'index.js'), exports.join('\n'))
