import $ from 'jquery'
import endswith from 'lodash.endswith'

// @To be implemented with native modules or libraries
// const stdlib = {};

export function process () {
  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    var moduleName

    let names = [
      /require.[\(]{0,}['"]([^'"]+)['"][\)]{0,}/.exec(line),
      /require_once.[\(]{0,}['"]([^'"]+)['"][\)]{0,}/.exec(line),
      /include.[\(]{0,}['"]([^'"]+)['"][\)]{0,}/.exec(line),
      /include_once.[\(]{0,}['"]([^'"]+)['"][\)]{0,}/.exec(line)
    ]
      .filter(x => x)
      .map(regex => regex[1])
    if (names.length) {
      moduleName = names[0]
    } else {
      return;
    }

    var url = endswith(moduleName, '.php') ? moduleName : `${moduleName}.php`;
    $(elem).find('.pl-s').wrap(`<a href="${url}"></a>`)
  })
}
