const $ = window.jQuery

const createLink = require('../helpers').createLink
const cratesurl = require('./rust').cratesurl

module.exports.process = function process () {
  switch (location.pathname.split('/').slice(-1)[0]) {
    case 'Cargo.toml':
      cargotoml()
      break
  }
}

function cargotoml () {
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line === '[dependencies]' || line === '[dev-dependencies]') {
      depsOpen = true
      return
    }

    if (line === '') {
      depsOpen = false
      return
    }

    if (depsOpen) {
      let moduleName = elem.find('.pl-smi').eq(0).text().trim()
      cratesurl(moduleName)
        .then(url => {
          createLink(elem.get(0), moduleName, url)
        })
        .catch(() => {})
    }
  })
}
