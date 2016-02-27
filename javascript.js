import $ from 'jquery'
import startswith from 'lodash.startswith'

const stdlib = {assert: 1, buffer: 1, addons: 1, child_process: 1, cluster: 1, console: 1, crypto: 1, debugger: 1, dns: 1, domain: 1, errors: 1, events: 1, fs: 1, globals: 1, http: 1, https: 1, modules: 1, net: 1, os: 1, path: 1, process: 1, punycode: 1, querystring: 1, readline: 1, repl: 1, stream: 1, string_decoder: 1, timers: 1, tls: 1, tty: 1, dgram: 1, url: 1, util: 1, v8: 1, vm: 1, zlib: 1}

export function process () {
  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    let es6import = /import .* from ['"]([^'"]+)['"]/.exec(line)
    let es6export = /export .* from ['"]([^'"]+)['"]/.exec(line)
    let commonjsrequire = /require *\(['"]([^)]+)['"]\)/.exec(line)

    var moduleName
    if (es6import) {
      moduleName = es6import[1]
    } else if (es6export) {
      moduleName = es6export[1]
    } else if (commonjsrequire) {
      moduleName = commonjsrequire[1]
    } else {
      return
    }

    var url
    if (startswith(moduleName, '.')) {
      url = moduleName + '.js'
    } else if (moduleName in stdlib) {
      url = 'https://nodejs.org/api/' + moduleName + '.html'
    } else {
      url = 'https://npmjs.com/package/' + moduleName.split('/')[0]
    }

    $(elem).find('.pl-s').wrap(`<a href="${url}"></a>`)
  })
}
