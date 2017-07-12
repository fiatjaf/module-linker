/* global chrome */

const $ = window.jQuery
const includes = require('lodash.includes')
const startswith = require('lodash.startswith')

const python = require('./languages/python').process
const javascript = require('./languages/javascript').process
const ruby = require('./languages/ruby').process
const gemfile = require('./languages/ruby').processGemfile
const julia = require('./languages/julia').process
const juliarequire = require('./languages/julia').processRequire
const crystal = require('./languages/crystal').process
const json = require('./languages/json').process
const yaml = require('./languages/yaml').process
const toml = require('./languages/toml').process
const rust = require('./languages/rust').process
const dart = require('./languages/dart').process
const nim = require('./languages/nim').process
const elm = require('./languages/elm').process
const c = require('./languages/c').process
const purescript = require('./languages/purescript').process
const haskell = require('./languages/haskell').process
const go = require('./languages/go').process
const markdown = require('./languages/markdown').process

function main () {
  // this global check will prevent us from running process() multiple times.
  if ($('#module-linker-done').length) return
  $('#js-repo-pjax-container').append($('<span id="module-linker-done">'))

  let path = location.pathname.split('/')
  window.pathdata = {
    user: path[1],
    repo: path[2],
    ref: path[4] || $('.branch-select-menu .js-select-button').text().trim() || 'master',
    current: path[4] ? path.slice(5) : '',
    last: path.slice(-1)[0]
  }

  let spath = window.pathdata.last.split('.')
  window.filetype = spath.length > 1
    ? spath.slice(-1)[0]
    : window.pathdata.last

  switch (window.filetype) {
    case 'py':
      python()
      break
    case 'js':
    case 'jsx':
    case 'es':
    case 'ts':
    case 'tsx':
    case 'coffee':
      javascript()
      break
    case 'json':
      json()
      break
    case 'yaml':
    case 'yml':
      yaml()
      break
    case 'toml':
      toml()
      break
    case 'dart':
      dart()
      break
    case 'rs':
      rust()
      break
    case 'nim':
      nim()
      break
    case 'cr':
      crystal()
      break
    case 'go':
      go()
      break
    case 'rb':
    case 'gemspec':
    case 'Rakefile':
      ruby()
      break
    case 'hs':
      haskell()
      break
    case 'c':
    case 'h':
      c()
      break
    case 'elm':
      elm()
      break
    case 'purs':
      purescript()
      break
    case 'Gemfile':
      gemfile()
      break
    case 'jl':
      julia()
      break
    case 'REQUIRE':
      juliarequire()
      break
    case 'md':
    case 'mdwn':
    case 'markdown':
      markdown()
      break
    default:
      let command = $('.blob-code-inner').first().text()
      if (!startswith(command, '#!')) {
        markdown()
      } else if (includes(command, 'run-cargo-script')) {
        rust()
      } else if (includes(command, 'runhaskell')) {
        haskell()
      } else if (includes(command, 'crystal')) {
        crystal()
      } else if (includes(command, 'python')) {
        python()
      } else if (includes(command, 'ruby')) {
        ruby()
      } else if (includes(command, 'node')) {
        node()
      } else if (includes(command, 'dart')) {
        dart()
      } else if (includes(command, 'nim')) {
        nim()
      } else if (includes(command, 'go')) {
        go()
      } else if (includes(command, 'elm-')) {
        elm()
      } else if (includes(command, 'julia')) {
        julia()
      // TODO: } else if (includes(command, 'pulp?')) { ?
      //  purescript()
      // TODO: } else if (includes(command, 'c?')) { ?
      //   c()
      } else {
        markdown()
      }
  }

  $(document).pjax('a.module-linker', '#js-repo-pjax-container', {timeout: 6000})

  let {user, repo} = window.pathdata
  $('.js-site-search-form')
    .attr('action', `/${user}/${repo}/search`)
    .find('.header-search-scope')
      .attr('href', `/${user}/${repo}`)
}

main()
chrome.runtime.onMessage.addListener(function () {
  main()
  setTimeout(main, 4000)
})
