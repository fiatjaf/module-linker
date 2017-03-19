'use strict'

const request = require('request-promise@1.0.2')

const json = url => request(url).then(body => JSON.parse(body))

module.exports = function (ctx, cb) {
  let registry = ctx.data.r
  let module = ctx.data.m

  console.log(registry, module)

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
    case 'dart':
      w = json(``)
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
