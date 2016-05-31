import $ from 'jquery'

import {processLine as lineJS} from './javascript'
import {processLines as linesGo} from './go'

export function process () {
  $('.highlight-source-js').each((_, elem) => {
    elem.innerText.trim()
      .split('\n')
      .forEach(line => {
        lineJS(elem, line)
      })
  })

  $('.highlight-source-go').each((_, elem) => {
    let block = $(elem)
    let lines = block[0].innerText
      .trim()
      .split('\n')

    linesGo(block, lines)
  })
}

