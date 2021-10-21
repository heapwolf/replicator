const DHT = require('dht-rpc')
const tape = require('tape')
const Replicator = require('../../')

module.exports = { get, append, ready, test }

function get (core, seq) {
  return new Promise((resolve, reject) => {
    core.get(seq, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function append (core, data) {
  return new Promise((resolve, reject) => {
    core.append(data, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function ready (core) {
  return new Promise((resolve, reject) => {
    core.ready((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function test (msg, fn) {
  tape(msg, function (t) {
    return new Promise((resolve, reject) => {
      const bootstrapper = DHT.bootstrapper(0, { ephemeral: true })

      bootstrapper.on('listening', async function () {
        const replicators = [makeReplicator(), makeReplicator()]

        let missing = replicators.length
        for (const r of replicators) {
          r.on('close', () => {
            if (--missing > 0) return
            bootstrapper.destroy()
          })
        }

        try {
          await fn(t, ...replicators)
          resolve()
        } catch (err) {
          reject(err)
        } finally {
          for (const r of replicators) r.destroy()
        }

        function makeReplicator () {
          const bootstrap = ['localhost:' + bootstrapper.address().port]
          return new Replicator({ bootstrap })
        }
      })
    })
  })
}
