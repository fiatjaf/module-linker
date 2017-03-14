const $ = window.jQuery

const npmurl = require('./javascript').npmurl
const composerurl = require('./php').composerurl

module.exports.process = function process () {
  switch (location.pathname.split('/').slice(-1)[0]) {
    case 'composer.json':
      composerjson()
      break
    case 'package.json':
      packagejson()
      break
  }
}

function composerjson () {
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line.match('"require"') || line.match('"require-dev"')) {
      depsOpen = true
    }

    if (line.match('}')) {
      depsOpen = false
    }

    if (depsOpen && elem.find('.pl-s').length === 2) {
      lineWithUrlFetcher(elem, composerurl)
    }
  })
}

function packagejson () {
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let line = elem.text().trim()

    if (line.match('"dependencies"') || line.match('"devDependencies"')) {
      depsOpen = true
    }

    if (line.match('}')) {
      depsOpen = false
    }

    if (depsOpen && elem.find('.pl-s').length === 2) {
      lineWithUrlFetcher(elem, npmurl)
    }
  })
}

function lineWithUrlFetcher (elem, urlfetcher) {
  let link = elem.find('.pl-s').eq(0)
  let moduleName = link.text().trim().slice(1, -1)

  urlfetcher(moduleName)
    .then(url => {
      if (link.parent().get(0).tagName === 'A') return
      if (link.text().slice(1, -1) !== moduleName) return

      link.wrap(`<a class="module-linker" href="${url}"></a>`)
    })
    .catch(() => {})
}
