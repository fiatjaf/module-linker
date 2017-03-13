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
  if (!e.target.value) {
    document.getElementById('message').innerHTML = ''
  }

  window.fetch('https://api.github.com/user', {
    headers: {'Authorization': 'token ' + e.target.value}
  })
  .then(r => r.json())
  .catch(() => {
    document.getElementById('message').innerHTML = 'failed to verify token validity. do you have an internet connection?<br>nevermind, it will be saved anyway.'
    return new Promise((resolve, reject) => setTimeout(resolve, 4000))
  })
  .then(user => {
    if (user.login) {
      chrome.storage.sync.set({token: e.target.value}, () => {
        if (chrome.runtime.lastError) {
          document.getElementById('message').innerHTML = chrome.runtime.lastError.message
        } else {
          document.getElementById('message').innerHTML = 'hello, ' + user.login + '! your token is now saved!'
        }
      })
    } else {
      document.getElementById('message').innerHTML = 'this is not a valid token, so we will not save it.'
    }
  })
})
