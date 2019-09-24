/* global chrome */

const PJAX_CONTAINER_SELECTOR = 'main'

const $ = window.jQuery

function main () {
  // this global check will prevent us from running process() multiple times.
  if ($('#module-linker-done').length) return
  $(PJAX_CONTAINER_SELECTOR).append($('<span id="module-linker-done">'))

  let path = location.pathname.split('/')
  window.pathdata = {
    user: path[1],
    repo: path[2],
    ref: path[4] || $('.branch-select-menu .js-select-button').text().trim() || 'master',
    current: path[4] ? path.slice(5) : '',
    last: path.slice(-1)[0]
  }

  let blobWrapper = document.querySelector('.data.blob-wrapper')
  if (blobWrapper) {
    window.filetype = blobWrapper.className.match(/type-(\w+)/)[1]
  } else {
    window.filetype = 'markdown'
  }

  switch (window.filetype) {
    case 'javascript':
    case 'coffeescript':
    case 'typescript':
    case 'jsx':
      require('./languages/javascript').process()
      break
    case 'go':
      require('./languages/go').process()
      break
    case 'c':
    case 'h':
    case 'cpp':
    case 'hpp':
      require('./languages/c').process()
      break
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
    case 'styl':
      require('./languages/css').process()
      break
    case 'haskell':
      require('./languages/haskell').process()
      break
    case 'python':
      require('./languages/python').process()
      break
    case 'ruby':
      require('./languages/ruby').process()
      break
    case 'crystal':
      require('./languages/crystal').process()
      break
    case 'dart':
      require('./languages/dart').process()
      break
    case 'elm':
      require('./languages/elm').process()
      break
    case 'json':
    case 'json5':
    case 'jsonld':
      require('./languages/json').process()
      break
    case 'julia':
      require('./languages/julia').process()
      break
    case 'markdown':
      require('./languages/markdown').process()
      break
    case 'nim':
      require('./languages/nim').process()
      break
    case 'nix':
      require('./languages/nix').process()
      break
    case 'purescript':
      require('./languages/purescript').process()
      break
    case 'rust':
      require('./languages/rust').process()
      break
    case 'toml':
      require('./languages/toml').process()
      break
    case 'yaml':
      require('./languages/yaml').process()
      break
    case 'php':
      require('./languages/php').process()
      break
    // css
    // scss
    // sass
    // less
    // stylus
    // ocaml'
    // lua
    case 'text':
      require('./languages/text').process()
      break
  }

  // setup pjax
  $(document).pjax('a.module-linker', PJAX_CONTAINER_SELECTOR, {timeout: 0})
  $(document).on('pjax:timeout', function (e) {
    e.preventDefault()
  })

  // update search box repo name tag and action attr after pjax
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
