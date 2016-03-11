import {process as python} from './python'
import {process as javascript} from './javascript'
import {process as ruby} from './ruby'
import {process as go} from './go'

const filetype = window.location.pathname.split('.').slice(-1)[0]

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
