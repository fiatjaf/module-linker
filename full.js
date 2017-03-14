/* global chrome */

const $ = window.jQuery

const python = require('./languages/python').process
const javascript = require('./languages/javascript').process
const ruby = require('./languages/ruby').process
const json = require('./languages/json').process
const yaml = require('./languages/yaml').process
const toml = require('./languages/toml').process
const rust = require('./languages/rust').process
const nim = require('./languages/nim').process
const go = require('./languages/go').process
const md = require('./languages/md').process

function main () {
  // this global check will prevent us from running process() multiple times.
  if ($('#module-linker-done').length) return
  $('#js-repo-pjax-container').append($('<span id="module-linker-done">'))

  let spath = window.location.pathname.split('.')
  window.filetype = spath.length > 1 ? spath.slice(-1)[0] : 'md'

  let path = location.pathname.split('/')
  window.pathdata = {
    user: path[1],
    repo: path[2],
    ref: path[4] || 'master',
    current: path[4] ? path.slice(5) : ''
  }

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
    case 'yaml':
      yaml()
      break
    case 'toml':
      toml()
      break
    case 'rs':
      rust()
      break
    case 'nim':
      nim()
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
