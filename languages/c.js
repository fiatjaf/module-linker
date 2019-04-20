/** @format */

const $ = window.jQuery

const createLink = require('../helpers').createLink

module.exports.process = function process() {
  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()

    let std = line.match(/#include +<([^>]+)>/)
    if (std) {
      let moduleName = std[1]

      if (c[moduleName]) {
        createLink(elem, moduleName, {
          url: c_base + c[moduleName],
          kind: 'stdlib'
        })
      } else if (cpp[moduleName]) {
        createLink(elem, moduleName, {
          url: cpp_base + moduleName,
          kind: 'stdlib'
        })
      } else {
        if (moduleName.slice(0, 5) === 'ccan/') {
          createLink(elem, moduleName, {
            url:
              'https://github.com/rustyrussell/ccan/blob/master/' + moduleName,
            kind: 'external'
          })
        }
      }
      return
    }

    let rel = line.match(/#include +"([^"]+)"/)
    if (rel) {
      let moduleName = rel[1]
      createLink(elem, moduleName, {
        url: moduleName,
        kind: 'relative'
      })
      return
    }
  })
}

const c_base = 'https://devdocs.io/c/'
const c = {
  'assert.h': 'error',
  'complex.h': 'numeric/complex',
  'ctype.h': 'string/byte',
  'errno.h': 'error',
  'fenv.h': 'numeric/fenv',
  'float.h': 'types/limits#Limits_of_floating_point_types',
  'inttypes.h': 'types/integer',
  'iso646.h': 'language/operator_alternative',
  'limits.h': 'types/limits',
  'locale.h': 'locale',
  'math.h': 'numeric/math',
  'setjmp.h': 'program',
  'signal.h': 'program',
  'stdalign.h': 'types',
  'stdarg.h': 'variadic',
  'stdatomic.h': 'atomic',
  'stdbool.h': 'types/boolean',
  'stddef.h': 'types',
  'stdint.h': 'types/integer',
  'stdio.h': 'io',
  'stdlib.h': 'memory',
  'stdnoreturn.h': 'types',
  'string.h': 'string/byte',
  'tgmath.h': 'numeric/tgmath',
  'threads.h': 'thread',
  'time.h': 'chrono',
  'uchar.h': 'string/multibyte',
  'wchar.h': 'string/wide',
  'wctype.h': 'string/wide'
}
const cpp_base = 'https://devdocs.io/cpp/header/'
const cpp = {
  cstdlib: 1,
  csignal: 1,
  csetjmp: 1,
  cstdarg: 1,
  typeinfo: 1,
  typeindex: 1,
  type_traits: 1,
  bitset: 1,
  functional: 1,
  utility: 1,
  ctime: 1,
  chrono: 1,
  cstddef: 1,
  initializer_list: 1,
  tuple: 1,
  any: 1,
  optional: 1,
  variant: 1,
  new: 1,
  memory: 1,
  scoped_allocator: 1,
  memory_resource: 1,
  climits: 1,
  cfloat: 1,
  cstdint: 1,
  cinttypes: 1,
  limits: 1,
  exception: 1,
  stdexcept: 1,
  cassert: 1,
  system_error: 1,
  cerrno: 1,
  cctype: 1,
  cwctype: 1,
  cstring: 1,
  cwchar: 1,
  cuchar: 1,
  string: 1,
  string_view: 1,
  array: 1,
  vector: 1,
  deque: 1,
  list: 1,
  forward_list: 1,
  set: 1,
  map: 1,
  unordered_set: 1,
  unordered_map: 1,
  stack: 1,
  queue: 1,
  algorithm: 1,
  execution_policy: 1,
  iterator: 1,
  cmath: 1,
  complex: 1,
  valarray: 1,
  random: 1,
  numeric: 1,
  ratio: 1,
  cfenv: 1,
  iosfwd: 1,
  ios: 1,
  istream: 1,
  ostream: 1,
  iostream: 1,
  fstream: 1,
  sstream: 1,
  strstream: 1,
  iomanip: 1,
  streambuf: 1,
  cstdio: 1,
  locale: 1,
  clocale: 1,
  codecvt: 1,
  regex: 1,
  atomic: 1,
  thread: 1,
  mutex: 1,
  shared_mutex: 1,
  future: 1,
  condition_variable: 1,
  filesystem: 1,
  ccomplex: 1,
  ctgmath: 1,
  ciso646: 1,
  cstdalign: 1,
  cstdbool: 1
}
