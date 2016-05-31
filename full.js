/* global chrome, window */

import {process as python} from './python'
import {process as javascript} from './javascript'
import {process as ruby} from './ruby'
import {process as go} from './go'
import {process as md} from './md'

function main () {
  let spath = window.location.pathname.split('.')
  window.filetype = spath.length > 1 ? spath.slice(-1)[0] : 'md'

  switch (window.filetype) {
    case 'md':
      md()
      break
    case 'py':
      python()
      break
    case 'js':
    case 'ts':
    case 'coffee':
      javascript()
      break
    case 'go':
      go()
      break
    case 'rb':
      ruby()
  }
}

main()
chrome.runtime.onMessage.addListener(function () {
  main()
})
