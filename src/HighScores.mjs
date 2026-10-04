const key = (...args) => args.join('_')

const HIGH_SCORES_TO_KEEP = 10

const DATA_STORE = 'high-scores'

// 1-time conversion routine into new format
if ('high-scores' in localStorage) {
  const highScores = localStorage.getItem('high-scores')
  try {
    for (const [oldkey, scores] of JSON.parse(highScores)) {
      const [difficulty, tileset] = oldkey.replace('v1$', '').split('$')

      const db = await open({ tileset, difficulty })
      const storeName = key(difficulty, tileset)
      const transaction = db.transaction([storeName], 'readwrite')

      await Promise.all(
        scores.map(
          ({ name, score, seed }) =>
            new Promise((resolve, reject) => {
              const req = transaction.objectStore(storeName).add({
                tileset,
                difficulty,
                name,
                score,
                seed,
                when: new Date(),
              })
              req.onerror = () => reject(req.error)
              req.onsuccess = () => resolve(req.result)
            }),
        ),
      )
      transaction.commit()
      db.close()
    }
  } catch (err) {
    console.error(err)
  } finally {
    localStorage.setItem('hs-backup', highScores)
    localStorage.removeItem('high-scores')
  }
}

// identifies if the tables resulting from options is different
// if so, bumps the version & re-opens the connection forcing upgrade

async function open({ tileset, difficulty } = {}) {
  const databases = await window.indexedDB.databases()
  const version = databases.find((d) => d.name === DATA_STORE)?.version ?? 1

  const storeName = key(difficulty, tileset)
  let db = await openDb(version)

  if (!db.objectStoreNames.contains(storeName)) {
    db.close()
    db = openDb(version + 1)
  }

  db.onversionchange = () => db.close() // take off ya hoser

  return db

  function openDb(version) {
    const { resolve, reject, promise } = Promise.withResolvers()

    const req = window.indexedDB.open(DATA_STORE, version)
    req.onerror = () => reject(req.error)
    req.onsuccess = (e) => resolve(e.target.result)
    req.onupgradeneeded = (e) => {
      const store = e.target.result.createObjectStore(storeName, {
        keyPath: 'id',
        autoIncrement: true,
      })
      store.createIndex('score', 'score', { unique: false })
    }
    return promise
  }
}

async function getScores({ difficulty, tileset }) {
  const db = await open({ tileset, difficulty })
  const storeName = key(difficulty, tileset)
  const transaction = db.transaction([storeName], 'readonly')

  const result = await new Promise((resolve, reject) => {
    const res = []
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve(res)

    const store = transaction.objectStore(storeName)

    let count = 0
    let max_score = Infinity

    const req = store.index('score').openCursor()
    req.onerror = () => reject(req.error)
    req.onsuccess = (evt) => {
      const cursor = evt.target.result
      if (cursor) {
        res.push(cursor.value)
        if (++count === HIGH_SCORES_TO_KEEP) max_score = cursor.value.score
        if (cursor.value.score <= max_score) return cursor.continue()
      }
      transaction.commit()
    }
  })

  db.close()

  result.sort((a, b) => {
    if (a.score > b.score) return 1
    if (a.score < b.score) return -1
    if (a.when < b.when) return 1
    if (a.when > b.when) return -1
    return 0
  })

  return result.slice(0, HIGH_SCORES_TO_KEEP)
}

async function getQualifies({ difficulty, tileset, score }) {
  if (score === '') return false
  const db = await open({ tileset, difficulty })

  const storeName = key(difficulty, tileset)
  const transaction = db.transaction([storeName], 'readonly')

  const value = await new Promise((resolve, reject) => {
    let result
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve(result)
    const index = transaction.objectStore(storeName).index('score')
    const req = index.count(IDBKeyRange.upperBound(score, true))
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      result = req.result < HIGH_SCORES_TO_KEEP
      transaction.commit()
    }
  })

  db.close()
  return value
}

export async function postNewScore({ difficulty, tileset, ...record }) {
  const db = await open({ tileset, difficulty })

  const storeName = key(difficulty, tileset)
  const transaction = db.transaction([storeName], 'readwrite')

  const value = await new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve(transaction.result)
    const req = transaction.objectStore(storeName).add(record)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => transaction.commit()
  })
  db.close()
  return value
}

// react expects the same function instances to be returned each render
// this storeCache technically never gets emtied, but it's fine I think?

const storeCache = new Map()

export const highScoreStoreCache = (tileset, difficulty) => {
  const storeKey = key(difficulty, tileset)
  if (storeCache.has(storeKey)) return storeCache.get(storeKey)

  const emitter = new EventTarget()

  let value = []

  const store = {
    subscribe(listener) {
      emitter.addEventListener('change', listener)
      return () => emitter.removeEventListener('change', listener)
    },

    getSnapshot() {
      return value
    },

    repopulate() {
      getScores({ difficulty, tileset })
        .then((scores) => (value = scores))
        .then(() => emitter.dispatchEvent(new CustomEvent('change')))
        .catch((error) => emitter.dispatchEvent('error', { error }))
    },
  }

  storeCache.set(storeKey, store)
  store.repopulate()
  return store
}

// react requires us to cache promises to use suspense
// the refetch variant is called in response to actions and clears the cache entry

function suspensify(promiseFactory) {
  const cache = new Map()

  function fetchData(args) {
    const promiseKey = key(Object.values(args))
    let promise = cache.get(promiseKey)
    if (promise == null) {
      cache.set(promiseKey, (promise = promiseFactory(args)))
      promise.status = 'pending'
      promise.then(
        (value) => {
          promise.status = 'fulfilled'
          promise.value = value
        },
        (err) => {
          promise.status = 'rejected'
          promise.reason = err
        },
      )
    }
    return promise
  }

  return {
    fetchData,
    clear() {
      cache.clear()
    },
  }
}

const suspensifiedGetScores = suspensify(getScores)

export const fetchScores = suspensifiedGetScores.fetchData
export const clearScores = suspensifiedGetScores.clear

const suspensifiedQualifies = suspensify(getQualifies)

export const fetchQualifies = suspensifiedQualifies.fetchData
export const clearQualifies = suspensifiedQualifies.clear
