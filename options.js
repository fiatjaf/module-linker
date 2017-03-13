/* global chrome */

chrome.storage.sync.get('token', ({token}) => {
  if (document.getElementById('token').value === '' && token) {
    document.getElementById('token').value = token
  }
})

document.getElementById('token').addEventListener('input', function (e) {
  document.getElementById('message').innerHTML = ''
})

document.getElementById('token').addEventListener('blur', function (e) {
  chrome.storage.sync.set({token: e.target.value}, () => {
    if (chrome.runtime.lastError) {
      document.getElementById('message').innerHTML = chrome.runtime.lastError.message
    } else {
      document.getElementById('message').innerHTML = 'saved!'
    }
  })
})
