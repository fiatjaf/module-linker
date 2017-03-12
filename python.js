const $ = require('jquery')
const sortIt = require('sort-it')
const endswith = require('lodash.endswith')

const fetch = window.fetch

module.exports.process = function process () {
  const path = window.location.pathname.split('/')
  const current = path.slice(5, -1)

  let treePromise =
    fetch(`https://api.github.com/repos/${path[1]}/${path[2]}/git/refs/heads/${path[4]}`)
    .then(res => res.json())
    .then(data => data.object.sha)
    .then(sha => fetch(`https://api.github.com/repos/${path[1]}/${path[2]}/git/trees/${sha}?recursive=4`))
    .then(res => res.json())
    .then(data => data.tree)
    .then(tree => tree.filter(b => endswith(b.path, '.py')))
    .then(tree => tree.map(b => {
      delete b.url
      delete b.size
      delete b.mode
      delete b.type
      delete b.sha
      let p = b.path.split('/')
      b.pathSize = p.length
      b.last = p[p.length - 1]
      return b
    }))
    .then(tree => sortIt(tree, ['-pathSize', '-last']))
    .then(tree => tree.map(b => b.path))

  $('.blob-code-inner').each((_, el) => {
    (function (elem) {
      let line = elem.innerText.trim()
      let fromimport = /from *([\w\.]*) import /.exec(line)
      let normalimport = /import *([\w\.]*)/.exec(line)

      if (fromimport || normalimport) {
        let moduleName = fromimport ? fromimport [1] : normalimport [1]
        if (moduleName[0] === '.') {
          // do not search the stdlib when starting with a dot
          moduleName = moduleName.slice(1)
        } else {
          if (moduleName in stdlib) {
            inject(`https://docs.python.org/3/library/${moduleName}.html`, elem)
            return
          } else if (moduleName.split('.')[0] in stdlib) {
            inject(`https://docs.python.org/3/library/${moduleName.split('.')}.html`, elem)
            return
          }
        }

        treePromise.then(paths => {
          // searching for relative modules
          var match
          var filepath

          (() => {
            for (let i = 0; i < paths.length; i++) {
              filepath = paths[i]

              let potentialModule = filepath.slice(0, -3).split('/').join('.')
              let tryingModule = moduleName
              while (tryingModule.length) {
                if (potentialModule === tryingModule) {
                  match = 'file'
                  return
                }

                let folderModule = potentialModule.slice(0, -9)
                if (endswith(potentialModule, '__init__') && folderModule === tryingModule) {
                  match = 'folder'
                  return
                }

                let relativeModule = potentialModule.split('.').slice(current.length).join('.')
                if (relativeModule === tryingModule) {
                  match = 'file'
                  return
                }

                let relativeFolderModule = relativeModule.slice(0, -9)
                if (endswith(relativeModule, '__init__') && relativeFolderModule === tryingModule) {
                  match = 'folder'
                  return
                }

                tryingModule = tryingModule.split('.').slice(0, -1).join('.')
              }
            }
          })()

          Promise.resolve()
          .then(() => {
            // deciding the url to which we will point (after knowing if it is a relative module)
            if (match) {
              let base = `/${path[1]}/${path[2]}/blob/${path[4]}/`
              if (match === 'file') {
                return base + filepath
              } else if (match === 'folder') {
                return base.replace('/blob/', '/tree/') +
                       filepath.split('/').slice(0, -1).join('/')
              }
            } else {
              // try the githublinker proxy
              return fetch(`https://githublinker.herokuapp.com/q/pypi/${moduleName.split('.')[0]}`)
              .then(r => r.json())
              .then(({url}) => url)
              .catch(() => {
                // then try the "home_page" from PYPI
                return fetch(`https://pypi.python.org/pypi/${moduleName.split('.')[0]}/json`, {
                  headers: {'X-Requested-With': 'fetch'}
                })
                .then(r => r.json())
                .then(data =>
                  data.info.home_page ||
                  // finally settle with the PYPI url
                  `https://pypi.python.org/pypi/${moduleName.split('.')[0]}`
                )
              })
            }
          })
          .then(url => {
            // inserting in the document
            if (url) inject(url, elem)
          })
        })
      }
    })(el)
  })
}

function inject (url, elem) {
  let stmt = $(elem).find('.pl-k')
  let parent = stmt.parent()
  var toReplace
  parent.contents().each((i, node) => {
    if (node === stmt[0]) {
      toReplace = parent.contents()[i + 1]
    }
  })
  $(`<a href="${url}"></a>`)
    .append(toReplace.textContent.trim())
    .insertAfter(stmt.eq(0))
  $(' ').insertAfter(stmt)
  toReplace.remove()

  stmt.eq(0).after(' ')
  stmt.eq(1).before(' ')
}

const stdlib = {site: 1, and: 1, int: 1, list: 1, str: 1, bytes: 1, set: 1, dict: 1, string: 1, re: 1, difflib: 1, textwrap: 1, unicodedata: 1, stringprep: 1, readline: 1, rlcompleter: 1, struct: 1, codecs: 1, datetime: 1, calendar: 1, collections: 1, 'collections.abc': 1, heapq: 1, bisect: 1, array: 1, weakref: 1, types: 1, copy: 1, pprint: 1, reprlib: 1, enum: 1, numbers: 1, math: 1, cmath: 1, decimal: 1, fractions: 1, random: 1, statistics: 1, itertools: 1, functools: 1, operator: 1, pathlib: 1, 'os.path': 1, fileinput: 1, stat: 1, filecmp: 1, tempfile: 1, glob: 1, fnmatch: 1, linecache: 1, shutil: 1, macpath: 1, pickle: 1, copyreg: 1, shelve: 1, marshal: 1, dbm: 1, sqlite3: 1, zlib: 1, gzip: 1, bz2: 1, lzma: 1, zipfile: 1, tarfile: 1, csv: 1, configparser: 1, netrc: 1, xdrlib: 1, plistlib: 1, hashlib: 1, hmac: 1, os: 1, io: 1, time: 1, argparse: 1, getopt: 1, logging: 1, 'logging.config': 1, 'logging.handlers': 1, getpass: 1, curses: 1, 'curses.textpad': 1, 'curses.ascii': 1, 'curses.panel': 1, platform: 1, errno: 1, ctypes: 1, threading: 1, multiprocessing: 1, concurrent: 1, 'concurrent.futures': 1, subprocess: 1, sched: 1, queue: 1, dummy_threading: 1, _thread: 1, _dummy_thread: 1, socket: 1, ssl: 1, select: 1, selectors: 1, asyncio: 1, asyncore: 1, asynchat: 1, signal: 1, mmap: 1, email: 1, json: 1, mailcap: 1, mailbox: 1, mimetypes: 1, base64: 1, binhex: 1, binascii: 1, quopri: 1, uu: 1, html: 1, 'html.parser': 1, 'html.entities': 1, 'xml.etree.ElementTree': 1, 'xml.dom': 1, 'xml.dom.minidom': 1, 'xml.dom.pulldom': 1, 'xml.sax': 1, 'xml.sax.handler': 1, 'xml.sax.saxutils': 1, 'xml.sax.xmlreader': 1, 'xml.parsers.expat': 1, webbrowser: 1, cgi: 1, cgitb: 1, wsgiref: 1, urllib: 1, 'urllib.request': 1, 'urllib.response': 1, 'urllib.parse': 1, 'urllib.error': 1, 'urllib.robotparser': 1, http: 1, 'http.client': 1, ftplib: 1, poplib: 1, imaplib: 1, nntplib: 1, smtplib: 1, smtpd: 1, telnetlib: 1, uuid: 1, socketserver: 1, 'http.server': 1, 'http.cookies': 1, 'http.cookiejar': 1, xmlrpc: 1, 'xmlrpc.client': 1, 'xmlrpc.server': 1, ipaddress: 1, audioop: 1, aifc: 1, sunau: 1, wave: 1, chunk: 1, colorsys: 1, imghdr: 1, sndhdr: 1, ossaudiodev: 1, gettext: 1, locale: 1, turtle: 1, cmd: 1, shlex: 1, tkinter: 1, 'tkinter.ttk': 1, 'tkinter.tix': 1, 'tkinter.scrolledtext': 1, typing: 1, pydoc: 1, doctest: 1, unittest: 1, 'unittest.mock': 1, test: 1, 'test.support': 1, bdb: 1, faulthandler: 1, pdb: 1, timeit: 1, trace: 1, tracemalloc: 1, distutils: 1, ensurepip: 1, venv: 1, zipapp: 1, sys: 1, sysconfig: 1, builtins: 1, __main__: 1, warnings: 1, contextlib: 1, abc: 1, atexit: 1, traceback: 1, __future__: 1, gc: 1, inspect: 1, fpectl: 1, code: 1, codeop: 1, zipimport: 1, pkgutil: 1, modulefinder: 1, runpy: 1, importlib: 1, parser: 1, ast: 1, symtable: 1, symbol: 1, token: 1, keyword: 1, tokenize: 1, tabnanny: 1, pyclbr: 1, py_compile: 1, compileall: 1, dis: 1, pickletools: 1, formatter: 1, msilib: 1, msvcrt: 1, winreg: 1, winsound: 1, posix: 1, pwd: 1, spwd: 1, grp: 1, crypt: 1, termios: 1, tty: 1, pty: 1, fcntl: 1, pipes: 1, resource: 1, nis: 1, syslog: 1, optparse: 1, imp: 1}
