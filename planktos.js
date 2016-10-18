let client = new WebTorrent()
let torrentId = 'magnet:?xt=urn:btih:606f32e1d214066d2c80a25dd2c4d1d2b2bb68f7&dn=www&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com'

download(torrentId)
registerSW()

function download(torrentId) {
  client.add(torrentId, function (torrent) {
    torrent.on('done', function() {
      console.log('Torrent download complete')
      var index = null
      for (let f of torrent.files) {
        sendFileToSW(f)
        if (f.name === 'index.html') index = f
      }
      // if (index != null) overwriteDocument(index)
    })
  })
}

// function overwriteDocument(index) {
//   index.getBuffer(function(err, buffer) {
//     if (err) throw err
//     var newHtml = document.createElement('html')
//     newHtml.innerHTML = buffer.toString()
//     document.replaceChild(newHtml, document.documentElement);
//   })
// }

function sendFileToSW(file) {
  file.getBlob(function(err, blob) {
    if (navigator.serviceWorker.controller != null) {
      var message = {
        name: file.name,
        blob: blob
      }
      console.log('SENT MESSAGE', message)
      navigator.serviceWorker.controller.postMessage(message)
    }
  })
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {

      if(reg.installing) {
        console.log('Service worker installing')
      } else if(reg.waiting) {
        console.log('Service worker installed')
      } else if(reg.active) {
        console.log('Service worker active')
      }

    }).catch(function(error) {
      // registration failed
      console.log('Registration failed with ' + error)
    })
  }
}
