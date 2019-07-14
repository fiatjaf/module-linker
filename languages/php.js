const resolve = require('resolve-pathname')

const external = require('../helpers').external
const treePromise = require('../helpers').treePromise
const createLink = require('../helpers').createLink
const htmlWithLink = require('../helpers').htmlWithLink
const bloburl = require('../helpers').bloburl
const treeurl = require('../helpers').treeurl

const extensions = ['php', 'phtml']

const stdlib = {stdClass: 1, Exception: 1, ErrorException: 1, Error: 1, CompileError: 1, ParseError: 1, TypeError: 1, ArgumentCountError: 1, ArithmeticError: 1, DivisionByZeroError: 1, Closure: 1, Generator: 1, ClosedGeneratorException: 1, WeakReference: 1, DateTime: 1, DateTimeImmutable: 1, DateTimeZone: 1, DateInterval: 1, DatePeriod: 1, LibXMLError: 1, SQLite3: 1, SQLite3Stmt: 1, SQLite3Result: 1, DOMException: 1, DOMStringList: 1, DOMNameList: 1, DOMImplementationList: 1, DOMImplementationSource: 1, DOMImplementation: 1, DOMNode: 1, DOMNameSpaceNode: 1, DOMDocumentFragment: 1, DOMDocument: 1, DOMNodeList: 1, DOMNamedNodeMap: 1, DOMCharacterData: 1, DOMAttr: 1, DOMElement: 1, DOMText: 1, DOMComment: 1, DOMTypeinfo: 1, DOMUserDataHandler: 1, DOMDomError: 1, DOMErrorHandler: 1, DOMLocator: 1, DOMConfiguration: 1, DOMCdataSection: 1, DOMDocumentType: 1, DOMNotation: 1, DOMEntity: 1, DOMEntityReference: 1, DOMProcessingInstruction: 1, DOMStringExtend: 1, DOMXPath: 1, finfo: 1, HashContext: 1, JsonException: 1, LogicException: 1, BadFunctionCallException: 1, BadMethodCallException: 1, DomainException: 1, InvalidArgumentException: 1, LengthException: 1, OutOfRangeException: 1, RuntimeException: 1, OutOfBoundsException: 1, OverflowException: 1, RangeException: 1, UnderflowException: 1, UnexpectedValueException: 1, RecursiveIteratorIterator: 1, IteratorIterator: 1, FilterIterator: 1, RecursiveFilterIterator: 1, CallbackFilterIterator: 1, RecursiveCallbackFilterIterator: 1, ParentIterator: 1, LimitIterator: 1, CachingIterator: 1, RecursiveCachingIterator: 1, NoRewindIterator: 1, AppendIterator: 1, InfiniteIterator: 1, RegexIterator: 1, RecursiveRegexIterator: 1, EmptyIterator: 1, RecursiveTreeIterator: 1, ArrayObject: 1, ArrayIterator: 1, RecursiveArrayIterator: 1, SplFileInfo: 1, DirectoryIterator: 1, FilesystemIterator: 1, RecursiveDirectoryIterator: 1, GlobIterator: 1, SplFileObject: 1, SplTempFileObject: 1, SplDoublyLinkedList: 1, SplQueue: 1, SplStack: 1, SplHeap: 1, SplMinHeap: 1, SplMaxHeap: 1, SplPriorityQueue: 1, SplFixedArray: 1, SplObjectStorage: 1, MultipleIterator: 1, PDOException: 1, PDO: 1, PDOStatement: 1, PDORow: 1, SessionHandler: 1, ReflectionException: 1, Reflection: 1, ReflectionFunctionAbstract: 1, ReflectionFunction: 1, ReflectionGenerator: 1, ReflectionParameter: 1, ReflectionType: 1, ReflectionNamedType: 1, ReflectionMethod: 1, ReflectionClass: 1, ReflectionObject: 1, ReflectionProperty: 1, ReflectionClassConstant: 1, ReflectionExtension: 1, ReflectionZendExtension: 1, ReflectionReference: 1, __PHP_Incomplete_Class: 1, php_user_filter: 1, Directory: 1, AssertionError: 1, SimpleXMLElement: 1, SimpleXMLIterator: 1, PharException: 1, Phar: 1, PharData: 1, PharFileInfo: 1, XMLReader: 1, XMLWriter: 1, GMP: 1, Collator: 1, NumberFormatter: 1, Normalizer: 1, Locale: 1, MessageFormatter: 1, IntlDateFormatter: 1, ResourceBundle: 1, Transliterator: 1, IntlTimeZone: 1, IntlCalendar: 1, IntlGregorianCalendar: 1, Spoofchecker: 1, IntlException: 1, IntlIterator: 1, IntlBreakIterator: 1, IntlRuleBasedBreakIterator: 1, IntlCodePointBreakIterator: 1, IntlPartsIterator: 1, UConverter: 1, IntlChar: 1, SodiumException: 1, Traversable: 1, IteratorAggregate: 1, Iterator: 1, ArrayAccess: 1, Serializable: 1, Countable: 1, Throwable: 1, DateTimeInterface: 1, JsonSerializable: 1, RecursiveIterator: 1, OuterIterator: 1, SeekableIterator: 1, SplObserver: 1, SplSubject: 1, SessionHandlerInterface: 1, SessionIdInterface: 1, SessionUpdateTimestampHandlerInterface: 1, Reflector: 1}

let currentFileNamespace

function getCurrentFileNamespace (line) {
  let names = [
    /^namespace ([^;{}]+)/.exec(line),
  ]
    .filter(x => x)
    .map(regex => regex[1])

  if (names.length) {
    currentFileNamespace = names[0]
  }
}

function checkFileImport (line) {
  let names = [
    /require+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /require +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
    /require_once+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /require_once +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
    /include+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /include +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
    /include_once+(?: __DIR__ *\. *)? *\(['"]([^)]+)['"]\);/.exec(line),
    /include_once +(?:__DIR__ *\. *)? *['"]([^)]+)['"];/.exec(line),
  ]
    .filter(x => x)
    .map(regex => regex[1])

  if (names.length) {
    return names[0]
  }

  return false
}

function checkNamespaceImport (line) {
  let names = [
    /^use ([^;{}]+)/.exec(line),
  ]
    .filter(x => x)
    .map(regex => regex[1])

  if (names.length) {
    return names[0]
  }

  return false
}

function processFileImport (moduleName, elem, line, currentPath, lineIndex) {
  Promise.resolve()
  .then(() => {
    return typeof lineIndex === 'undefined'
      ? treePromise()
        .then(paths => {
          for (let i = 0; i < paths.length; i++) {
            let path = paths[i]

            // ignore paths ending in anything but one of our extensions
            if (extensions.indexOf(path.split('.').slice(-1)[0]) === -1) {
              continue
            }

            let module
            if (moduleName.charAt(0) === '/') {
              module = moduleName.substr(1)
            } else {
              module = moduleName
            }

            let resolved = resolve(module, currentPath)
            if (path === resolved) {
              let { user, repo, ref } = window.pathdata
              return bloburl(user, repo, ref, path)
            }
          }

          throw new Error('fallback')
        })
        .catch(() => {
          let {user, repo, ref} = window.pathdata
          let module

          if (moduleName.charAt(0) === '/') {
            module = moduleName.substr(1)
          } else {
            module = moduleName
          }

          return {
            url: bloburl(user, repo, ref, resolve(module, currentPath)),
            kind: 'maybe'
          }
        })
      : null
  })
  .then(url => {
    if (typeof lineIndex !== 'undefined') {
      // lineIndex is passed from markdown.js, meaning we must replace
      // only in that line -- in this case `elem` is the whole code block,
      // not, as normally, a single line
      let lines = elem.innerHTML.split('\n')
      lines[lineIndex] = htmlWithLink(lines[lineIndex], moduleName, url, true)
      elem.innerHTML = lines.join('\n')
      return
    }

    createLink(elem, moduleName, url, true)
  })
}

function processNamespaceImport (moduleName, elem, line, currentPath, lineIndex) {
  let moduleNames = moduleName.split(',').map(item => item.trim().replace(/ as .*/, ''))

  moduleNames.forEach((moduleName) => {
    Promise.resolve()
    .then(() => {
      if (moduleName in stdlib) {
        // built-in class or interface
        let name = moduleName.replace(/_/g, '-').toLowerCase()
        return {
          url: 'https://www.php.net/manual/en/class.' + name + '.php',
          kind: 'stdlib'
        }
      } else {
        let name = moduleName.replace(/\\/g, '/') + '.php'

        let module = typeof lineIndex === 'undefined'
          ? treePromise()
            .then(paths => {
              for (let i = 0; i < paths.length; i++) {
                let path = paths[i]
                let current = name

                // ignore paths ending in anything but one of our extensions
                if (extensions.indexOf(path.split('.').slice(-1)[0]) === -1) {
                  continue
                }

                let parts = current.split('/').length
                for (let j = 0; j < parts; j++) {
                  if (path.endsWith('/' + current) && (currentFileNamespace !== undefined && name.includes(currentFileNamespace.split('\\')[0]))) {
                    let { user, repo, ref } = window.pathdata
                    return bloburl(user, repo, ref, path)
                  }

                  current = current.substring(current.indexOf('/') + 1)
                }
              }

              return null
            })
          : null

        if (module === null) {
          // package from Packagist
          // currently not supported
        }

        return module
      }
    })
    .then(url => {
      if (typeof lineIndex !== 'undefined') {
        // lineIndex is passed from markdown.js, meaning we must replace
        // only in that line -- in this case `elem` is the whole code block,
        // not, as normally, a single line.
        let lines = elem.innerHTML.split('\n')
        lines[lineIndex] = htmlWithLink(lines[lineIndex], moduleName, url, true)
        elem.innerHTML = lines.join('\n')
        return
      }

      createLink(elem, moduleName, url, true)
    })
  })
}

module.exports.process = process
function process () {
  let { current } = window.pathdata

  $('.blob-code-inner').each((_, elem) => {
    let line = elem.innerText.trim()
    processLine(elem, line, current.join('/'))
  })
}

module.exports.processLine = processLine
function processLine (elem, line, currentPath, lineIndex) {
  getCurrentFileNamespace(line)

  let fileModuleName = checkFileImport(line)
  if (fileModuleName) {
    processFileImport(fileModuleName, elem, line, currentPath, lineIndex)
    return
  }

  let namespaceModuleName = checkNamespaceImport(line)
  if (namespaceModuleName) {
    processNamespaceImport(namespaceModuleName, elem, line, currentPath, lineIndex)
    return
  }
}

module.exports.composerurl = composerurl
function composerurl (moduleName) {
  if (moduleName === 'php') {
    // package requires specific PHP version
    // ignore this when parsing
    return Promise.reject()
  }

  if (moduleName.startsWith('ext-') && moduleName.split('/').length === 1) {
    // package require specific PHP extension
    // link it to PHP documentation website
    let ext = moduleName.split('-')[1].toLowerCase()
    return Promise.resolve({
      url: `https://www.php.net/manual/en/book.${ext}.php`,
      kind: 'stdlib'
    })
  }

  // package require normal Composer package
  // link it to Packagist
  return external('composer', moduleName)
    .catch(() => ({
      url: `https://packagist.org/packages/${moduleName}`,
      kind: 'maybe'
    }))
}
