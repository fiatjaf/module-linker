module.exports.pathdata = function () {
  let path = location.pathname.split('/')
  return {
    user: path[1],
    repo: path[2],
    ref: path[4] || 'master',
    current: path[4] ? path.slice(5) : ''
  }
}

module.exports.bloburl = function (user, repo, ref, path) {
  path = path[0] === '/' ? path.slice(1) : path
  return `https://github.com/${user}/${repo}/blob/${ref}/${path}`
}
