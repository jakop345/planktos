module.exports.install = install

require('debug').enable('planktos:*')
const debug = require('debug')('planktos:downloader')
const WebTorrent = require('webtorrent')
const IdbChunkStore = require('indexeddb-chunk-store')
const IdbKvStore = require('idb-kv-store')
const TabElect = require('tab-elect')

let webtorrent = null
let downloaded = null
let persistent = null
let installed = false
let tabElect = null

function install () {
  if (typeof BroadcastChannel === 'undefined') throw new Error('No BroadcastChannel support')
  if (typeof navigator === 'undefined') throw new Error('must be called in a wep page')
  if (!navigator.serviceWorker) throw new Error('No servier worker support')
  if (installed) return

  installed = true
  tabElect = new TabElect('planktos')
  tabElect.on('elected', onElect)
  tabElect.on('deposed', onDepose)
  tabElect.on('error', function (err) {
    console.error(err)
    onDepose()
  })
}

function onElect () {
  persistent = persistent || new IdbKvStore('planktos')
  persistent.get('torrentMetaBuffer').then(torrentMeta => {
    if (!tabElect.isLeader) return
    download(new Buffer(torrentMeta))
  })
}

function onDepose () {
  if (webtorrent) webtorrent.destroy()
  webtorrent = null
}

function download (torrentId) {
  downloaded = downloaded || new IdbKvStore('planktos-downloaded')
  webtorrent = webtorrent || new WebTorrent()

  if (webtorrent.get(torrentId)) return

  let opts = {store: IdbChunkStore}
  webtorrent.add(torrentId, opts, function (torrent) {
    if (torrent.urlList.length === 0) {
      const isSingleFile = torrent.files.length === 1
      const swUrl = navigator.serviceWorker.controller.scriptURL

      let webSeedUrl = swUrl.substring(0, swUrl.lastIndexOf('/'))
      if (isSingleFile) webSeedUrl += '/planktos/' + torrent.files[0].name

      torrent.addWebSeed(webSeedUrl)
    }

    torrent.on('done', function () {
      debug('TORRENT DOWNLOADED', torrent.files.map(f => f.name))
      let channel = new BroadcastChannel('planktos-downloaded')
      torrent.files.forEach(function (f) {
        downloaded.set(f.name, true)
        .then(() => channel.postMessage({ name: f.name }))
      })
    })
  })
}
