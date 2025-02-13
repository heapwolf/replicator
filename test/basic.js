const Hypercore = require('hypercore')
const ram = require('random-access-memory')
const { get, append, test } = require('./helpers')

test('basic', async function (t, replicator, clone) {
  const core = new Hypercore(ram)

  replicator.add(core, { announce: true, lookup: false })

  await append(core, 'test')

  const coreClone = new Hypercore(ram, core.key)

  clone.add(coreClone, { lookup: true, announce: false })

  t.same(await get(coreClone, 0), Buffer.from('test'))
})

test('multi core swarm', async function (t, replicator, clone) {
  const a = new Hypercore(ram)
  const b = new Hypercore(ram)

  replicator.add(a, { announce: true, lookup: false })
  replicator.add(b, { announce: true, lookup: false })

  await append(a, 'a test')
  await append(b, 'b test')

  const aClone = new Hypercore(ram, a.key)
  const bClone = new Hypercore(ram, b.key)

  clone.add(bClone, { lookup: true, announce: false })
  clone.add(aClone, { lookup: true, announce: false })

  t.same(await get(aClone, 0), Buffer.from('a test'))
  t.same(await get(bClone, 0), Buffer.from('b test'))
})

test('multi core swarm higher latency', async function (t, replicator, clone) {
  const a = new Hypercore(ram)
  const b = new Hypercore(ram)

  replicator.add(a, { announce: true, lookup: false })

  await append(a, 'a test')
  await append(b, 'b test')

  const aClone = new Hypercore(ram, a.key)
  const bClone = new Hypercore(ram, b.key)

  clone.add(bClone, { lookup: true, announce: false })
  clone.add(aClone, { lookup: true, announce: false })

  replicator.on('discovery-key', function () {
    replicator.add(b, { announce: true, lookup: false })
  })

  t.same(await get(aClone, 0), Buffer.from('a test'))
  t.same(await get(bClone, 0), Buffer.from('b test'))
})
