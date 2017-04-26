const $ = window.jQuery

const createLink = require('../helpers').createLink

module.exports.process = function process () {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let std = line.match(/#include +<([^>]+)>/)
    if (std) {
      let moduleName = std[1]

      if (stdlib[moduleName]) {
        createLink(elem, moduleName, {
          url: stdlib_base + stdlib[moduleName],
          kind: 'stdlib'
        })
      }
      return
    }

    let rel = line.match(/#include +"([^"]+)"/)
    if (rel) {
      let moduleName = rel[1]
      createLink(elem, moduleName, {
        url: moduleName,
        kind: 'relative'})
      return
    }
  })
}

const stdlib_base = 'http://devdocs.io/c/'
const stdlib = {'assert.h': 'error', 'complex.h': 'numeric/complex', 'ctype.h': 'string/byte', 'errno.h': 'error', 'fenv.h': 'numeric/fenv', 'float.h': 'types/limits#Limits_of_floating_point_types', 'inttypes.h': 'types/integer', 'iso646.h': 'language/operator_alternative', 'limits.h': 'types/limits', 'locale.h': 'locale', 'math.h': 'numeric/math', 'setjmp.h': 'program', 'signal.h': 'program', 'stdalign.h': 'types', 'stdarg.h': 'variadic', 'stdatomic.h': 'atomic', 'stdbool.h': 'types/boolean', 'stddef.h': 'types', 'stdint.h': 'types/integer', 'stdio.h': 'io', 'stdlib.h': 'memory', 'stdnoreturn.h': 'types', 'string.h': 'string/byte', 'tgmath.h': 'numeric/tgmath', 'threads.h': 'thread', 'time.h': 'chrono', 'uchar.h': 'string/multibyte', 'wchar.h': 'string/wide', 'wctype.h': 'string/wide'}
