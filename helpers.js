/* global chrome */

const fetch = window.fetch

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
    let treePromise =
      gh(`repos/${user}/${repo}/git/refs/heads/${ref}`)
      .then(data => data.object.sha)
      .then(sha => gh(`repos/${user}/${repo}/git/trees/${sha}?recursive=4`))
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

module.exports.createLink = function createLink (elem, moduleName, url, backwards = false) {
  if (!moduleName || !url) return
  elem.innerHTML = module.exports.htmlWithLink(elem.innerHTML, moduleName, url, backwards)
}

module.exports.htmlWithLink = function htmlWithLink (baseHTML, moduleName, url, backwards = false) {
  let link = `<a class="module-linker" href="${url}">${moduleName}</a>`

  if (backwards) {
    let index = baseHTML.lastIndexOf(moduleName)
    return baseHTML.slice(0, index) +
      link +
      baseHTML.slice(index + moduleName.length)
  } else {
    return baseHTML.replace(moduleName, link)
  }
}