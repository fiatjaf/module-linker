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
