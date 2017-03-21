const $ = window.jQuery

const darturl = require('./dart').darturl

const createLink = require('../helpers').createLink

module.exports.process = function process () {
  let name = window.pathdata.last.match(/[^.]+/)[0]
  switch (name) {
    case 'stack':
      stackyaml()
      break
    case 'pubspec':
      pubspecyaml()
      break
    case 'shard':
      shardyml()
      break
  }
}

function stackyaml () {
  // haskell
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

      createLink(elem.get(0), moduleName, {
        url: `https://hackage.haskell.org/package/${moduleName}`,
        kind: 'external'
      })
    }

    if (!line.match(/^- /)) {
      depsOpen = false
    }
  })
}

function pubspecyaml () {
  // dart
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let rawline = elem.text()

    if (rawline.match(/^dependencies:/) || rawline.match(/^dev_dependencies:/)) {
      depsOpen = true
      return
    }

    if (depsOpen && rawline.match(/^ +[\w_]*:/)) {
      let link = elem.find('.pl-ent').eq(0)
      let moduleName = link.text().trim()

      darturl(moduleName)
        .then(info => createLink(link.get(0), moduleName, info))
    }

    if (!rawline.match(/^ /)) {
      depsOpen = false
    }
  })
}

function shardyml () {
  // crystal
  var depsOpen = false

  $('.blob-code-inner').each((_, elem) => {
    elem = $(elem)
    let rawline = elem.text()

    if (rawline.match(/^dependencies:/) || rawline.match(/^development_dependencies:/)) {
      depsOpen = true
      return
    }

    if (depsOpen && rawline.match(/\bgithub:/)) {
      let link = elem.find('.pl-s').eq(0)
      let repo = link.text().trim()

      createLink(link.get(0), repo, {
        url: `https://github.com/${repo}`,
        kind: 'external'
      })
    }

    if (!rawline.match(/^ /)) {
      depsOpen = false
    }
  })
}
