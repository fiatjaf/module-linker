const $ = window.jQuery

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
      let link = elem.find('.pl-smi').eq(0)
      let moduleName = link.text().trim()

      cratesurl(moduleName)
        .then(url => {
          if (link.parent().get(0).tagName === 'A') return
          if (link.text() !== moduleName) return

          link.wrap(`<a class="module-linker" href="${url}">`)
        })
        .catch(() => {})
    }
  })
}
