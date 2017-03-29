/* global chrome */

const $ = window.jQuery
const fetch = window.fetch
const delay = require('delay')

var waitToken = new Promise((resolve, reject) => {
  chrome.storage.sync.get('token', ({token}) => {
    if (chrome.runtime.lastError) {
      reject(chrome.runtime.lastError.message)
    } else {
      resolve(token)
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
    .then(r => {
      return r.json()
    })
  )
}

var treePromiseCache = {}
module.exports.treePromise = function (postProcess) {
  let { user, repo, ref } = window.pathdata
  let key = `${user}:${repo}:${ref}`

  if (!treePromiseCache[key]) {
    let treePromise = Promise.resolve()
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

    if (postProcess) {
      treePromise = treePromise.then(postProcess)
    }

    treePromiseCache[key] = treePromise
  }

  return treePromiseCache[key]
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
  var link = $('<a>')
    .addClass('module-linker')
    .attr('href', url.url || url)
    .text(moduleName)

  if (url.kind) {
    // stdlib, external, maybe
    link = link.addClass(url.kind)
  }

  if (url.desc) {
    link = $('<span>')
      .attr('data-wenk', url.desc)
      .attr('data-wenk-pos', 'right')
      .addClass('wenk-length--medium')
      .append(link)
  }

  link = link.get(0).outerHTML

  if (backwards) {
    let index = baseHTML.lastIndexOf(moduleName)
    return baseHTML.slice(0, index) +
      link +
      baseHTML.slice(index + moduleName.length)
  } else {
    return baseHTML.replace(moduleName, link)
  }
}

var excount = 0
const exturls = [
  `https://external-resolver.now.sh`,
  `https://wt-fiatjaf-gmail_com-0.run.webtask.io/resolver`,
  `https://fiatjaf.stdlib.com/external-resolver/`,
  `https://runkit.io/fiatjaf/58cea8a57fb61d0014ab7135/branches/master`
] // all these urls work by just appending the same querystring to them.
var waitingCache = {} // a cache of promises to external modules.
module.exports.external = function externalResolver (registry, module) {
  let key = `${registry}::${module}`
  if (waitingCache[key]) return waitingCache[key]

  let exidx = excount % exturls.length
  let url = exturls[exidx] + `?r=${registry}&m=${module}`
  let dl = (excount - exidx) * 100

  let res = delay(dl)
    .then(() => fetch(url))
    .then(r => {
      if (r.status > 299) throw new Error(`${registry}/${module} request failed.`)
      return r.json()
    })
    .then(info => {
      info.kind = 'external'
      return info
    })

  excount++ // this will cause the delay to increase after each call to the same backend
  setTimeout(() => { excount = 0 }, 15000 /* reset after 15 seconds */)

  waitingCache[key] = res
  return waitingCache[key]
}
