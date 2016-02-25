import $ from 'jquery'
import startswith from 'lodash.startswith'
import endswith from 'lodash.endswith'

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
