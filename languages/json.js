const $ = window.jQuery

const npmurl = require('./javascript').npmurl

module.exports.process = function process () {
  switch (location.pathname.split('/').slice(-1)[0]) {
    case 'package.json':
      packagejson()
      break
  }
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
      packagejsonLine(elem)
    }
  })
}

function packagejsonLine (elem) {
  let link = elem.find('.pl-s').eq(0)
  let moduleName = link.text().trim().slice(1, -1)

  npmurl(moduleName)
    .then(url => {
      if (link.parent().get(0).tagName === 'A') return
      if (link.text().slice(1, -1) !== moduleName) return

      link.wrap(`<a class="module-linker" href="${url}"></a>`)
    })
    .catch(() => {})
}
