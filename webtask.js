'use strict'

const request = require('request-promise@1.0.2')
const cheerio = require('cheerio')

function fetch (registry, module) {
  const json = url => request(url).then(JSON.parse)
  const html = url => request(url).then(cheerio.load)

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
          url: info.source_code_uri || info.homepage_uri ||
               info.project_url || `https://rubygems.org/gems/${module}`,
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
      w = json(`http://pub.dartlang.org/api/packages/${module}`)
        .then(info => ({
          url: info.latest.pubspec.homepage || `https://pub.dartlang.org/packages/${module}`,
          docs: info.latest.pubspec.documentation,
          desc: info.latest.pubspec.description
        }))
      break
    case 'julia':
      w = request(`https://raw.githubusercontent.com/JuliaLang/METADATA.jl/metadata-v2/${module}/url`)
        .then(url => ({url: url.trim().replace('git://', 'https://')}))
        .catch(() =>
          html('http://pkg.julialang.org')
            .then($ =>
              $('.pkgnamedesc a')
                .map((i, a) => console.log(i, a) || a)
                .filter((_, a) => $(a).text() === module)
                .map((_, a) => ({
                  url: $(a).attr('href'),
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
          return {url: `https://hackage.haskell.org/package/$${module}`}
        })
      break
    case 'crystal':
      w = request(`https://jsonbin.org/fiatjaf/crystal/${module}`)
        .then(url => ({url: url}))
      break
    default:
      w = Promise.reject(new Error('no registry found with that name.'))
  }

  return w
    .then(data => {
      if (data.desc) {
        data.desc = data.desc.slice(0, 250)
      }
      return data
    })
}

module.exports = function (ctx, cb) {
  let registry = ctx.data.r
  let module = ctx.data.m

  fetch(registry, module)
    .then(data => {
      if (data.desc) {
        data.desc = data.desc.slice(0, 250)
      }
      return data
    })
    .then(data => cb(null, data))
    .catch(e => cb(e))
}
