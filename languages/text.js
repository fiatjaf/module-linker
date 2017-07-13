const $ = window.jQuery

const juliaurl = require('./julia').juliaurl
const createLink = require('../helpers').createLink

module.exports.process = function process () {
  switch (window.pathdata.last) {
    case 'REQUIRE':
      juliarequire()
      break
    // case 'requirements.txt':
    //   python_requirements()
    //   break
  }
}

function juliarequire () {
  $('.blob-code-inner').each((i, elem) => {
    let line = elem.innerText.trim()
    let match = line.match(/\w+/) // no spaces or hyphens
    if (match && match[0][0].toUpperCase() === match[0][0]) {
      juliaurl(match[0]).then(info => createLink(elem, match[0], info))
    }
  })
}
