/* global chrome */

const $ = window.jQuery

const python = require('./languages/python').process
const javascript = require('./languages/javascript').process
const ruby = require('./languages/ruby').process
const json = require('./languages/json').process
const go = require('./languages/go').process
const md = require('./languages/md').process

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
    case 'json':
      json()
      break
    case 'go':
      go()
      break
    case 'rb':
      ruby()
  }

  $(document).pjax('a.module-linker', '#js-repo-pjax-container')
}

main()
chrome.runtime.onMessage.addListener(function () {
  main()
})
