import $ from 'jquery'

import {processLine} from './javascript'

export function process () {
  $('.highlight-source-js').each((_, elem) => {
    elem.innerText.trim()
      .split('\n')
      .forEach(line => {
        processLine(elem, line)
      })
  })
}

