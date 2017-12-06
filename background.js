/* global chrome */

chrome.webNavigation.onHistoryStateUpdated.addListener(function (props) {
  var url = props.url
  var tabId = props.tabId
  if (url) {
    var p = url.split('/')
    if (p[2] === 'github.com' && p.length >= 5) {
      chrome.tabs.sendMessage(tabId, true)
    }
  }
})

// show a page telling the user to input their token
chrome.storage.sync.get('token', ({token}) => {
  if (chrome.runtime.lastError) return

  if (!token) {
    chrome.storage.sync.get('seenOptions', ({seenOptions}) => {
      if (chrome.runtime.lastError) return
      if (!seenOptions) {
        chrome.tabs.create({
          url: '/options.html'
        })
      }
    })
  }
})

// disable csp headers on github
// (webextension requests shouldn't need this, but chrome is broken)
if (chrome.webRequest.onHeadersReceived) {
  chrome.webRequest.onHeadersReceived.addListener(details => {
    for (var i = 0; i < details.responseHeaders.length; i++) {
      if ('content-security-policy' === details.responseHeaders[i].name.toLowerCase()) {
        details.responseHeaders[i].value = ''
      }
    }

    return {
      responseHeaders: details.responseHeaders
    }
  }, {
    urls: ['https://github.com/*/*'],
    types: ['main_frame']
  }, ['blocking', 'responseHeaders'])
}
