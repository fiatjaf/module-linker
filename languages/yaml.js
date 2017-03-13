const $ = window.jQuery

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
      if (link.parent().get(0).tagName === 'A') return
      if (link.text() !== moduleName) return

      link.wrap(`<a class="module-linker" href="${url}"></a>`)
    }

    if (!line.match(/^- /)) {
      depsOpen = false
    }
  })
}
