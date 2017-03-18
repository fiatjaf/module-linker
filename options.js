/* global chrome */

var currentToken

function message (text) {
  document.getElementById('message').innerHTML = text
}

chrome.storage.sync.get('token', ({token}) => {
  if (chrome.runtime.lastError) {
    message(chrome.runtime.lastError.message)
    return
  }
  if (document.getElementById('token').value === '' && token) {
    document.getElementById('token').value = token
    currentToken = token
  } else {
    message('please input a token, otherwise this extension may (and probably will) fail to resolve relative module paths (maybe other unpredictable issues will happen also).')
  }
})

document.getElementById('token').addEventListener('input', function (e) {
  message('')
})

document.getElementById('token').addEventListener('blur', function (e) {
  if (!e.target.value) {
    if (currentToken) {
      chrome.storage.sync.set({token: null}, () => {
        if (chrome.runtime.lastError) {
          message(chrome.runtime.lastError.message)
          return
        }
        message('token removed.')
      })
    }

    return
  }

  window.fetch('https://api.github.com/user', {
    headers: {'Authorization': 'token ' + e.target.value}
  })
  .then(r => r.json())
  .catch(() => {
    message('failed to verify token validity. do you have an internet connection?<br>nevermind, it will be saved anyway.')
    currentToken = e.target.value
    return new Promise((resolve, reject) => setTimeout(resolve, 4000))
  })
  .then(user => {
    if (user.login) {
      currentToken = e.target.value
      chrome.storage.sync.set({token: e.target.value}, () => {
        if (chrome.runtime.lastError) {
          message(chrome.runtime.lastError.message)
          return
        }
        message('hello, ' + user.login + '! your token is now saved!')
      })
    } else {
      message('this is not a valid token, so we will not save it.')
    }
  })
})

chrome.storage.sync.set({seenOptions: true})
