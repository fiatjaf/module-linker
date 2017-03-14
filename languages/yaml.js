const $ = window.jQuery

const createLink = require('../helpers').createLink

module.exports.process = function process () {
  if (location.pathname.split('/').slice(-1)[0].match(/stack[\d.-]*\.yaml/)) {
    stackyaml()
  }
}

function stackyaml () {
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line.match('packages:') || line.match('extra-deps:')) {
      depsOpen = true
      return
    }

    if (depsOpen && line.match(/^- *[\w-]+[\d.]*$/)) {
      let link = elem.find('.pl-s').eq(0)
      let moduleName = link.text().trim()

      let url = `https://hackage.haskell.org/package/${moduleName}`
      createLink(elem.get(0), moduleName, url)
    }

    if (!line.match(/^- /)) {
      depsOpen = false
    }
  })
}
