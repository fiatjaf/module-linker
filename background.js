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
