/* global chrome, window */

const python = require('./python').process
const javascript = require('./javascript').process
const ruby = require('./ruby').process
const go = require('./go').process
const md = require('./md').process

function main () {
  let spath = window.location.pathname.split('.')
  window.filetype = spath.length > 1 ? spath.slice(-1)[0] : 'md'

  switch (window.filetype) {
    case 'md':
      md()
      break
    case 'py':
      python()
      break
    case 'js':
    case 'jsx':
    case 'es':
    case 'ts':
    case 'coffee':
      javascript()
      break
    case 'go':
      go()
      break
    case 'rb':
      ruby()
  }
}

main()
chrome.runtime.onMessage.addListener(function () {
  main()
})
