/* global chrome */

const $ = window.jQuery
const fetch = window.fetch
// const delay = require('delay')
const {lastIndexOfRegex} = require('index-of-regex')

var waitToken = new Promise((resolve, reject) => {
  chrome.storage.sync.get('token', (res) => {
    if (chrome.runtime.lastError) {
      reject(chrome.runtime.lastError.message)
    } else {
      resolve(res.token)
    }
  })
})

function gh (path) {
  return waitToken
    .then(token =>
      fetch(`https://api.github.com/${path}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'github.com/fiatjaf/module-linker',
          'Authorization': `token ${token}`
        }
      })
    )
    .then(r => r.json())
}

module.exports.treePromise = treePromise
var treePromiseCache = {}
function treePromise (postProcess) {
  let pp = typeof postProcess !== 'undefined' ? postProcess.name : ''

  let { user, repo, ref } = window.pathdata
  let xhrkey = `${user}:${repo}:${ref}`
  let ppkey = xhrkey + ':' + pp

  // full cache hit
  if (treePromiseCache[ppkey]) {
    return treePromiseCache[ppkey]
  }

  // cached tree, but not with the postProcess fn
  // (happens when there is more than one postProcess function
  //  in the same user/repo/ref)
  if (treePromiseCache[xhrkey]) {
    let processedPromise = treePromiseCache[xhrkey]
      .then(tree => {
        if (postProcess) {
          return postProcess(tree)
        }
        return tree
      })
    treePromiseCache[ppkey] = processedPromise
    return processedPromise
  }

  // nothing found. fetch the tree then recall this same function
  let xhrPromise = Promise.resolve()
    .then(() => {
      if (ref.length >= 40) {
        return ref // ref is the commit sha itself
      }

      // try to fetch the commit sha from the page's html
      let commitTeaseSha = $('.commit-tease-sha')
      if (commitTeaseSha.length) {
        return commitTeaseSha.attr('href').split('/').slice(-1)[0]
      }

      // fallback to the API
      return gh(`repos/${user}/${repo}/git/refs/heads/${ref}`)
        .then(data => data.object.sha)
    })
    .then(sha =>
      gh(`repos/${user}/${repo}/git/trees/${sha}?recursive=4`)
    )
    .then(data => data.tree.map(blob => blob.path))

  treePromiseCache[xhrkey] = xhrPromise

  return treePromise(postProcess)
}

module.exports.bloburl = function (user, repo, ref, path) {
  path = path[0] === '/' ? path.slice(1) : path
  return `https://github.com/${user}/${repo}/blob/${ref}/${path}`
}

module.exports.treeurl = function (user, repo, ref, path) {
  path = path[0] === '/' ? path.slice(1) : path
  return `https://github.com/${user}/${repo}/tree/${ref}/${path}`
}

module.exports.createLink = function (elem, moduleName, url, backwards = false) {
  if (!moduleName || !url) return
  elem.innerHTML = module.exports.htmlWithLink(elem.innerHTML, moduleName, url, backwards)
}

module.exports.htmlWithLink = function (baseHTML, moduleName, url, backwards = false) {
  let kind = url.kind || 'relative'

  var link = $('<a>')
    .addClass('module-linker')
    .attr('href', url.url || url)
    .text(moduleName)
    .addClass(kind)

  if (url.desc) {
    link = $('<span>')
      .attr('data-wenk', url.desc)
      .append(link)
  }

  link = link.get(0).outerHTML
  let regexN = moduleName.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  let regex = new RegExp(
    (moduleName[0].match(/\w/) ? '\\b' : '') +
    regexN +
    (moduleName.slice(-1)[0].match(/w/) ? '\\b' : '')
  )

  if (backwards) {
    let index = lastIndexOfRegex(baseHTML, regex)
    return baseHTML.slice(0, index) +
      link +
      baseHTML.slice(index + moduleName.length)
  } else {
    // use regex to replace the module name, but escape regex special characters before
    return baseHTML.replace(
      regex,
      link
    )
  }
}

var moduleCache = {} // a cache of promises to external modules.
module.exports.external = external
function external (registry, module) {
  let key = `${registry}::${module}`
  if (moduleCache[key]) return moduleCache[key]

  var w

  switch (registry) {
    case 'composer':
      w = json(`https://packagist.org/packages/${module}.json`)
        .then(info => ({
          url: info.package.repository || `https://packagist.org/packages/${module}`,
          kind: 'external',
          desc: info.package.description
        }))
      break
    case 'rubygems':
      w = json(`https://rubygems.org/api/v1/gems/${module}.json`)
        .then(info => ({
          url: info.source_code_uri || info.homepage_uri ||
               info.project_url || `https://rubygems.org/gems/${module}`,
          docs: info.documentation_uri,
          kind: 'external',
          desc: info.info
        }))
      break
    case 'npm':
      w = json(`https://registry.npmjs.org/${module.replace('/', '%2f')}`)
        .then(info => ({
          url: info.url || info.homepage || info.repository.url
            ? info.repository.url.replace('git+', '')
            : `https://npmjs.com/package/${module}`,
          kind: 'external',
          desc: info.description || info.keywords.join(', ')
        }))
      break
    case 'pypi':
      w = json(`https://pypi.python.org/pypi/${module}/json`)
        .then(info => ({
          url: info.info.home_page || info.info.package_url || `https://pypi.python.org/pypi/${module}`,
          kind: 'external',
          desc: info.info.summary
        }))
      break
    case 'crates':
      w = json(`https://crates.io/api/v1/crates/${module}`)
        .then(info => ({
          url: info.crate.repository ||
               info.crate.homepage ||
               `https://crates.io/crates/${module}`,
          docs: info.crate.documentation || info.crate.homepage,
          kind: 'external',
          desc: info.crate.description || info.categories.length && info.categories[0].description
        }))
      break
    case 'dart':
      w = json(`http://pub.dartlang.org/api/packages/${module}`)
        .then(info => ({
          url: info.latest.pubspec.homepage ||
               `https://pub.dartlang.org/packages/${module}`,
          docs: info.latest.pubspec.documentation,
          kind: 'external',
          desc: info.latest.pubspec.description
        }))
      break
    case 'julia':
      w = text(`https://raw.githubusercontent.com/JuliaLang/METADATA.jl/metadata-v2/${module}/url`)
        .then(url => ({url: url.trim().replace('git://', 'https://')}))
        .catch(() =>
          html('http://pkg.julialang.org')
            .then($ =>
              $('.pkgnamedesc a')
                .map((i, a) => console.log(i, a) || a)
                .filter((_, a) => $(a).text() === module)
                .map((_, a) => ({
                  url: $(a).attr('href'),
                  kind: 'external',
                  desc: $(a).parent().parent().find('h4').text()
                }))
                .get(0)
            )
        )
      break
    case 'hackage':
      w = html(`https://hackage.haskell.org/package/${module}`)
        .then($ => {
          let url = $('a[href*="github.com"]').attr('href')
          if (url) return {url: url.replace('git://', 'https://')}
          return {
            kind: 'external',
            url: `https://hackage.haskell.org/package/$${module}`
          }
        })
      break
    case 'crystal':
      w = text(`https://jsonbin.org/fiatjaf/crystal/${module}`)
        .then(url => ({
          kind: 'external',
          url: url
        }))
      break
    default:
      w = Promise.reject(new Error('no registry found with that name.'))
  }

  w = w
    .then(data => {
      if (data.desc) {
        data.desc = data.desc.slice(0, 250)
      }
      return data
    })

  moduleCache[key] = w
  return moduleCache[key]
}

var httpCache = {} // a cache of promises to external http results
module.exports.cached = function cachedHttpRequest (url) {
  let key = url
  if (httpCache[key]) return Promise.resolve(httpCache[key])
  httpCache[key] = fetch(url)
    .then(r => {
      if (r.status >= 300) {
        throw new Error(`failed to fetch ${url}.`)
      }
      return r.text()
    })
  return httpCache[key]
}

const text = module.exports.text = function cachedTextHttpRequest (url) {
  return module.exports.cached(url)
}

const json = module.exports.json = function cachedJsonHttpRequest (url) {
  return module.exports.cached(url)
    .then(text => JSON.parse(text))
}

const html = module.exports.html = function cachedHtmlHttpRequest (url) {
  return module.exports.cached(url)
    .then(text => $.parseHTML(text))
}
