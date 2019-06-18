const resolve = require('resolve-pathname')

const external = require('../helpers').external
const treePromise = require('../helpers').treePromise
const createLink = require('../helpers').createLink
const htmlWithLink = require('../helpers').htmlWithLink
const bloburl = require('../helpers').bloburl
const treeurl = require('../helpers').treeurl

const extensions = ['php', 'phtml']

module.exports.process = process
function process () {
  let { current } = window.pathdata

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()
    processLine(elem, line, current.join('/'))
  })
}

module.exports.processLine = processLine
function processLine (elem, line, currentPath, lineIndex) {
  let moduleName

  let names = [
    /require+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /require +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
    /require_once+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /require_once +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
    /include+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /include +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
    /include_once+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /include_once +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
  ]
    .filter(x => x)
    .map(regex => regex[1])

  if (names.length) {
    moduleName = names[0]
  } else {
    return
  }

  Promise.resolve()
  .then(() => {
    return typeof lineIndex === 'undefined'
      ? treePromise()
        .then(paths => {
          for (let i = 0; i < paths.length; i++) {
            let path = paths[i]

            // ignore paths ending in anything but one of our extensions
            if (extensions.indexOf(path.split('.').slice(-1)[0]) === -1) {
              continue
            }

            let module
            if (moduleName.charAt(0) === '/') {
              module = moduleName.substr(1)
            } else {
              module = moduleName
            }

            let resolved = resolve(module, currentPath)
            if (path === resolved) {
              let { user, repo, ref } = window.pathdata
              return bloburl(user, repo, ref, path)
            }
          }

          throw new Error('fallback')
        })
        .catch(() => {
          let {user, repo, ref} = window.pathdata
          let module

          if (moduleName.charAt(0) === '/') {
            module = moduleName.substr(1)
          } else {
            module = moduleName
          }

          return {
            url: bloburl(user, repo, ref, resolve(module, currentPath)),
            kind: 'maybe'
          }
        })
      : null
  })
  .then(url => {
    if (typeof lineIndex !== 'undefined') {
      // lineIndex is passed from markdown.js, meaning we must replace
      // only in that line -- in this case `elem` is the whole code block,
      // not, as normally, a single line
      let lines = elem.innerHTML.split('\n')
      lines[lineIndex] = htmlWithLink(lines[lineIndex], moduleName, url, true)
      elem.innerHTML = lines.join('\n')
      return
    }

    createLink(elem, moduleName, url, true)
  })
}

module.exports.composerurl = composerurl
function composerurl (moduleName) {
  if (moduleName === 'php') {
    // package requires specific PHP version
    // ignore this when parsing
    return Promise.reject()
  }

  if (moduleName.startsWith('ext-') && moduleName.split('/').length === 1) {
    // package require specific PHP extension
    // link it to PHP documentation website
    let ext = moduleName.split('-')[1].toLowerCase()
    return Promise.resolve({
      url: `https://www.php.net/manual/en/book.${ext}.php`,
      kind: 'stdlib'
    })
  }

  // package require normal Composer package
  // link it to Packagist
  return external('composer', moduleName)
    .catch(() => ({
      url: `https://packagist.org/packages/${moduleName}`,
      kind: 'maybe'
    }))
}
