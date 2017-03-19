/* Import dependencies, declare constants */

/**
* Your function call
* @param {Object} params Execution parameters
*   Members
*   - {Array} args Arguments passed to function
*   - {Object} kwargs Keyword arguments (key-value pairs) passed to function
*   - {String} remoteAddress The IPv4 or IPv6 address of the caller
*
* @param {Function} callback Execute this to end the function call
*   Arguments
*   - {Error} error The error to show if function fails
*   - {Any} returnValue JSON serializable (or Buffer) return value
*/

const got = require('got')

const json = url => got(url).then(r => JSON.parse(r.body))

module.exports = (params, cb) => {
  let {r: registry, m: module} = params.kwargs

  var w

  switch (registry) {
    case 'composer':
      w = json(`https://packagist.org/packages/${module}.json`)
        .then(info => ({
          url: info.package.repository || `https://packagist.org/packages/${module}`,
          desc: info.description
        }))
      break
    case 'rubygems':
      w = json(`https://rubygems.org/api/v1/gems/${module}.json`)
        .then(info => ({
          url: info.source_code_uri || info.homepage_uri || info.project_url,
          docs: info.documentation_uri,
          desc: info.info
        }))
      break
    case 'npm':
      w = json(`https://registry.npmjs.org/${module}`)
        .then(info => ({
          url: info.url || info.homepage ||
               info.repository.url
               ? info.repository.url.replace('git+', '')
               : `https://npmjs.com/package/${module}`,
          desc: info.description || info.keywords.join(', ')
        }))
      break
    case 'pypi':
      w = json(`https://pypi.python.org/pypi/${module}/json`)
        .then(info => ({
          url: info.info.home_page || info.info.package_url || `https://pypi.python.org/pypi/${module}`,
          desc: info.info.summary
        }))
      break
    case 'crates':
      w = json(`https://crates.io/api/v1/crates/${module}`)
        .then(info => ({
          url: info.crate.repository || info.crate.homepage || `https://crates.io/crates/${module}`,
          docs: info.crate.documentation || info.crate.homepage,
          desc: info.crate.description || info.categories.length && info.categories[0].description
        }))
      break
    default:
      w = Promise.reject(new Error('no registry found with that name.'))
  }

  w
    .then(data => {
      if (data.desc) {
        data.desc = data.desc.slice(0, 250)
      }
      return data
    })
    .then(data => cb(null, data))
    .catch(e => cb(e))
}
