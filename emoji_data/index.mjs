import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const things = (await fs.readdir(path.join(__dirname, 'data')))
  .filter((thing) => thing.endsWith('.txt') && thing !== 'emoji-test.txt')
  .map((fname) => path.join(__dirname, 'data', fname))

const outputPath = path.join(__dirname, '../src/data')

//
// if looking at add more data into this set, there's a lot between "transport" and "symbols" that haven't been used yet
// most of them are non-complicated, don't use any zwj , it's more a question of classification and grouping than anything else.
//

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

// some of these are really simple

;['faces', 'flags', 'food', 'plants', 'places', 'animals'].forEach((thing) => {
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

// left is the default i suppose. this only gets uesd in a few cases around sports
// there might be more directionality available in other sets like arrows and the like

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

// transgender is listed for completion's sake, in practice it doesn't work anywhere
// cases where it *might* instead use un-qualified gender to mean "person"
// it's actually only used with the trans flag (which is already encoded as part of flags)

const gendersSigns = {
  '\u{2640}': 'female',
  '\u{2642}': 'male',
  // '\u{26A7}': 'transgender',
}

const doesNotSupportSkintone = [
  'zombie',
  'genie',
  'mechanical arm',
  'mechanical leg',
  'brain',
  'anatomical heart',
  'lungs',
  'tooth',
  'bone',
  'eyes',
  'eye',
  'tongue',
  'mouth',
  'biting lip',
]

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

// most of the hand gestures can support multiple skin tones

outputs.body_parts = data.body_parts.reduce((memo, entry) => {
  if (doesNotSupportSkintone.includes(entry.label)) {
    memo.push(entry)
  } else {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      memo.push({
        emoji: `${entry.emoji}\u200D${skincode}`,
        label: `${entry.label} ${skinlabel}`,
      })
    })
  }
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
        emoji: `${entry.emoji}\u200D${skincode}`,
        label: `${entry.label} (${skinlabel})`,
      })
    })
    return memo
  }, []),
)

// gestures support up to {gender}{zwj}{thing}{zwj}{skin}{dircode}

// some of them don't (no gender: ninja, etc.; no skintone: zombie)

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

// 1F468 1F3FC 200D 1F9AF 200D 27A1                       ; minimally-qualified # 👨🏼‍🦯‍➡ E15.1 man with white cane facing right: medium-light skin tone

outputs.people.push(
  ...data.people_modifiers.reduce((memo, entry) => {
    Object.entries(skintones).forEach(([skincode, skinlabel]) => {
      Object.entries(manWoman).forEach(([gendercode, genderlabel]) => {
        memo.push({
          emoji: `${gendercode}${skincode}\u200D${entry.emoji}`,
          label: `${genderlabel} ${entry.label} (${skinlabel})`,
        })
        // in practice there is only 1 direction supported for these joiners
        if (supportsDirection.includes(entry.label)) {
          memo.push({
            emoji: `${gendercode}${skincode}\u200D${entry.emoji}\u200D\u27A1`,
            label: `${genderlabel} ${entry.label} facing right (${skinlabel})`,
          })
        }
      })
    })
    return memo
  }, []),
)

// people roles can support {thing}{skin}{zwj}{gender_code}{zwj}{direction}

// 1F9DF 200D 2640 FE0F                                   ; fully-qualified     # 🧟‍♀️ E5.0 woman zombie

outputs.people.push(
  ...data.people_roles
    .filter((x) => doesNotSupportSkintone.includes(x.label))
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

// people roles support {thing}{skin}{zwj}{gender_code}

// 1F977 1F3FD                                            ; fully-qualified     # 🥷🏽 E13.0 ninja: medium skin tone

outputs.people.push(
  ...data.people_roles
    .filter((x) => doesNotSupportsGender.includes(x.label))
    .reduce((memo, entry) => {
      Object.entries(skintones).forEach(([skincode, skinlabel]) => {
        memo.push({
          emoji: `${entry.emoji}\u200D${skincode}`,
          label: `${entry.label} (${skinlabel})`,
        })
      })
      return memo
    }, []),
)

// 1F6B6 1F3FE 200D 2640 FE0F 200D 27A1                   ; minimally-qualified # 🚶🏾‍♀️‍➡ E15.1 woman walking facing right: medium-dark skin tone

outputs.people.push(
  ...data.people_roles
    .filter(
      (x) =>
        !(
          doesNotSupportsGender.includes(x.label) ||
          doesNotSupportSkintone.includes(x.label)
        ),
    )
    .reduce((memo, entry) => {
      Object.entries(skintones).forEach(([skincode, skinlabel]) => {
        Object.entries(gendersSigns).forEach(([gendercode, genderlabel]) => {
          memo.push({
            emoji: `${entry.emoji}${skincode}\u200D${gendercode}`,
            label: `${entry.label} ${genderlabel} (${skinlabel})`,
          })
          if (supportsDirection.includes(entry.label)) {
            memo.push({
              emoji: `${entry.emoji}${skincode}\u200D${gendercode}\u200D\u27A1`,
              label: `${entry.label} ${genderlabel} facing right (${skinlabel})`,
            })
          }
        })
      })
      return memo
    }, []),
)

// no modifiers for some of these (it's just troll, skier, fencer)

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
