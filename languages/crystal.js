const $ = window.jQuery
const startswith = require('lodash.startswith')
const resolve = require('resolve-pathname')

const external = require('../helpers').external
const createLink = require('../helpers').createLink
const htmlWithLink = require('../helpers').htmlWithLink
const bloburl = require('../helpers').bloburl
const treeurl = require('../helpers').treeurl

module.exports.process = function process () {
  let { current } = window.pathdata

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()
    processLine(elem, line, current.join('/'))
  })
}

module.exports.processLine = processLine

function processLine (elem, line, currentPath, lineIndex) {
  let match = line.match(/^require *['"]([^'"]+)['"]/)
  if (!match) return

  let moduleName = match[1]

  Promise.resolve()
  .then(() => {
    if (startswith(moduleName, '.')) {
      // is local package.
      let {user, repo, ref, current} = window.pathdata
      if (moduleName.split('/').slice(-1)[0] === '*') {
        // somehow a wildcard require is possible, so let's redirect to the tree
        let path = resolve(moduleName.split('/').slice(0, -1).join('/'), current.join('/'))
        return treeurl(user, repo, ref, path)
      } else {
        // normal file require
        let path = resolve(moduleName + '.cr', current.join('/'))
        return bloburl(user, repo, ref, path)
      }
    } else if (moduleName.split('/')[0] in stdlib) {
      // is from the stdlib
      moduleName = moduleName.split('/')[0]
      let camel = stdlib[moduleName] ||
        moduleName
          .split('_')
          .map(w => w[0].toUpperCase() + w.slice(1))
          .join('')
      return `https://crystal-lang.org/api/${camel}.html`
    } else {
      // probably an external shard
      return crystalurl(moduleName)
    }
  })
  .then(url => {
    if (typeof lineIndex !== 'undefined') {
      // lineIndex is passed from markdown.js, meaning we must replace
      // only in that line -- in this case `elem` is the whole code block,
      // not, as normally, a single line.
      let lines = elem.innerHTML.split('\n')
      lines[lineIndex] = htmlWithLink(lines[lineIndex], moduleName, url)
      elem.innerHTML = lines.join('\n')
      return
    }

    createLink(elem, moduleName, url, true)
  })
}

function crystalurl (moduleName) {
  return external('crystal', moduleName).catch(() => '')
}

const stdlib = {'adler32': 'Adler32', 'benchmark': 0, 'big': 0, 'callstack': 0, 'char': 0, 'compiler': 0, 'concurrent': 0, 'crc32': 'CRC32', 'crypto': 0, 'csv': 'CSV', 'debug': 0, 'digest': 0, 'dir': 0, 'ecr': 0, 'event': 0, 'ext': 0, 'file': 0, 'flate': 0, 'gc': 'GC', 'gzip': 0, 'lib_c': 0, 'lib_z': 0, 'markdown': 0, 'math': 0, 'oauth': 'OAuth', 'oauth2': 'OAuth2', 'openssl': 'OpenSSL', 'process': 0, 'random': 0, 'range': 0, 'regex': 0, 'spec': 0, 'string': 0, 'thread': 0, 'time': 0, 'unicode': 0, 'xml': 'XML', 'yaml': 'YAML', 'zip': 0, 'zlib': 0, 'array': 0, 'atomic': 0, 'base64': 'Base64', 'big_float': 0, 'big_int': 0, 'big_rational': 0, 'bit_array': 0, 'bool': 0, 'box': 0, 'class': 0, 'colorize': 0, 'comparable': 0, 'complex': 0, 'deque': 0, 'dl': 'DL', 'docs_main': 0, 'empty': 0, 'enum': 0, 'enumerable': 0, 'env': 'ENV', 'errno': 0, 'exception': 0, 'fiber': 0, 'file_utils': 0, 'float': 0, 'hash': 0, 'html': 'HTML', 'http': 'HTTP', 'iconv': 0, 'indexable': 0, 'ini': 'INI', 'int': 0, 'intrinsics': 0, 'io': 'IO', 'iterable': 0, 'iterator': 0, 'json': 'JSON', 'kernel': 0, 'levenshtein': 0, 'llvm': 'LLVM', 'logger': 0, 'macros': 0, 'main': 0, 'mutex': 0, 'named_tuple': 0, 'nil': 0, 'number': 0, 'object': 0, 'option_parser': 0, 'partial_comparable': 0, 'pointer': 0, 'prelude': 0, 'pretty_print': 0, 'primitives': 0, 'proc': 0, 'raise': 0, 'readline': 0, 'reference': 0, 'reflect': 0, 'secure_random': 0, 'semantic_version': 0, 'set': 0, 'signal': 0, 'slice': 0, 'socket': 0, 'static_array': 0, 'string_pool': 0, 'string_scanner': 0, 'struct': 0, 'symbol': 0, 'system': 0, 'tempfile': 0, 'termios': 0, 'tuple': 0, 'union': 0, 'uri': 'URI', 'value': 0, 'weak_ref': 0}
