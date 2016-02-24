import $ from 'jquery'
import startswith from 'lodash.startswith'
import endswith from 'lodash.endswith'

const fetch = window.fetch
const location = window.location

const path = window.location.pathname.split('/')
const kind = location.pathname.split('.').slice(-1)[0]

if (kind === 'go') {
  var importing = false

  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    var startedImporting = false
    if (startswith(line, 'import')) {
      importing = true
      startedImporting = true
    }

    if (importing) {
      let module = $(elem).find('.pl-s')
      if (module.length) {
        let moduleName = module.text().slice(1, -1)

        var url
        if (startswith(moduleName, 'github.com/')) {
          url = 'https://' + moduleName
        } else if (moduleName.indexOf('.') === -1) {
          url = 'https://golang.org/pkg/' + moduleName
        } else {
          url = 'https://godoc.org/' + moduleName
        }
        module.wrap(`<a href="${url}"></a>`)

        // single line import
        if (startedImporting) importing = false
      }
    }

    if (endswith(line, ')')) {
      importing = false
    }
  })
} else if (kind === 'js') {
  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    let es6import = /import .* from ['"]([^'"]+)['"]/.exec(line)
    let commonjsrequire = /require *\(['"]([^)]+)['"]\)/.exec(line)

    var moduleName
    if (es6import) {
      moduleName = es6import[1]
    } else if (commonjsrequire) {
      moduleName = commonjsrequire[1]
    } else {
      return
    }

    var url
    if (startswith(moduleName, '.')) {
      url = moduleName + '.js'
    } else {
      url = 'https://npmjs.com/package/' + moduleName
    }

    $(elem).find('.pl-s').wrap(`<a href="${url}"></a>`)
  })
} else if (kind === 'py') {
  let treePromise =
    fetch(`https://api.github.com/repos/${path[1]}/${path[2]}/git/refs/heads/${path[4]}`)
    .then(res => res.json())
    .then(data => data.object.sha)
    .then(sha => fetch(`https://api.github.com/repos/${path[1]}/${path[2]}/git/trees/${sha}?recursive=4`))
    .then(res => res.json())
    .then(data => data.tree)
    .then(tree => tree.sort((a, b) => a.path.split('/').length - b.path.split('/').length))
    .then(tree => tree.reverse())
  let current = path.slice(5, -1)

  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    let fromimport = /from *([\w\.]*) import /.exec(line)
    let normalimport = /import *([\w\.]*)/.exec(line)

    if (fromimport || normalimport) {
      let moduleName = fromimport ? fromimport [1] : normalimport [1]

      treePromise.then(tree => {
        // searching for relative modules
        var match
        var filepath

        (() => {
          for (let i = 0; i < tree.length; i++) {
            filepath = tree[i].path

            if (endswith(filepath, '.py')) {
              let potentialModule = filepath.slice(0, -3).split('/').join('.')
              let tryingModule = moduleName
              while (tryingModule.length) {
                if (potentialModule === tryingModule) {
                  match = 'file'
                  return
                }

                let folderModule = potentialModule.slice(0, -9)
                if (endswith(potentialModule, '__init__') && folderModule === tryingModule) {
                  match = 'folder'
                  return
                }

                let relativeModule = potentialModule.split('.').slice(current.length).join('.')
                if (relativeModule === tryingModule) {
                  match = 'file'
                  return
                }

                let relativeFolderModule = relativeModule.slice(0, -9)
                if (endswith(relativeModule, '__init__') && relativeFolderModule === tryingModule) {
                  match = 'folder'
                  return
                }

                tryingModule = tryingModule.split('.').slice(0, -1).join('.')
              }
            }
          }
        })()

        Promise.resolve()
        .then(() => {
          // deciding the url to which we will point (after knowing if it is a relative module)
          if (match) {
            let base = `https://github.com/${path[1]}/${path[2]}/blob/${path[4]}/`
            if (match === 'file') {
              return base + filepath
            } else if (match === 'folder') {
              return base.replace('/blob/', '/tree/') +
                     filepath.split('/').slice(0, -1).join('/')
            }
          } else {
            // try the standard library
            return fetch(`https://cors-anywhere.herokuapp.com/https://docs.python.org/3/library/${moduleName.split('.')[0]}.html`, {method: 'HEAD', headers: {'X-Requested-With': 'fetch'}})
            .then(res => {
              if (res.ok) {
                return `https://docs.python.org/3/library/${moduleName.split('.')[0]}.html`
              } else {
                throw new Error('not on standard library!')
              }
            })
            .catch(() =>
              // try the "home_page" from PYPI
              fetch(`https://cors-anywhere.herokuapp.com/https://pypi.python.org/pypi/${moduleName.split('.')[0]}/json`, {headers: {'X-Requested-With': 'fetch'}})
              .then(res => res.json())
              .then(data =>
                data.info.home_page ||
                `https://pypi.python.org/pypi/${moduleName.split('.')[0]}`
                // or settle with the PYPI url
              )
            )
          }
        })
        .then(url => {
          // inserting in the document
          let stmt = $(elem).find('.pl-k')
          let parent = stmt.parent()
          var toReplace
          parent.contents().each((i, node) => {
            if (node === stmt[0]) {
              toReplace = parent.contents()[i + 1]
            }
          })
          $(`<a href="${url}"></a>`)
            .append(toReplace.textContent.trim())
            .insertAfter(stmt.eq(0))
          $(' ').insertAfter(stmt)
          toReplace.remove()

          stmt.eq(0).after(' ')
          stmt.eq(1).before(' ')
        })
      })
    }
  })
}
