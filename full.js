/* global chrome */

import {process as python} from './python'
import {process as javascript} from './javascript'
import {process as ruby} from './ruby'
import {process as go} from './go'

function main () {
  let filetype = window.location.pathname.split('.').slice(-1)[0]

  switch (filetype) {
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
