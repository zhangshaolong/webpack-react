import axios from 'axios'

axios.defaults.baseURL = '/map_editor/api/'
axios.defaults.headers['x-requested-with'] = 'XMLHttpRequest'
// axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'//'application/x-www-form-urlencoded'
axios.defaults.timeout = 60000
const CancelToken = axios.CancelToken

const ajax = function (path, params, options, type) {
  let cancel
  let context = options.context
  if (context) {
    let loadingCount = context.dataset._loadingCount || 0
    context.dataset._loadingCount = ++loadingCount
    if (loadingCount === 1) {
      context.classList.add('loading')
      let mask = document.createElement('div')
      mask.className = 'mask'
      mask.onclick = function (e) {
        e.stopPropagation()
      }
      context.appendChild(mask)
    }
  }

  const promise = new Promise((resolve, reject) => {
    let options = {
      url: path,
      method: type,
      cancelToken: new CancelToken(function (canl) {
        cancel = canl
      })
    }
    if (type === 'get') {
      options.params = params
    } else {
      options.data = params
      options.transformRequest = [function (data, config) {
        if (data && config.post['Content-Type'].indexOf('application/x-www-form-urlencoded') > -1) {
          let str = ''
          for (let key in data) {
            str += '&' + key + '=' + data[key]
          }
          if (str) {
            return str.substr(1)
          }
        }
        return JSON.stringify(data)
      }]
    }
    axios(options).then((res) => {
      if (context) {
        let loadingCount = context.dataset._loadingCount || 0
        context.dataset._loadingCount = --loadingCount
        if (loadingCount <= 0) {
          context.classList.remove('loading')
          let mask = context.querySelector('.mask')
          if (mask) {
            context.removeChild(mask)
          }
          delete options.context
        }
      }
      let resp = res.data
      let code = resp.code
      if (code === 302) { // to login
      } else if (code === 403) { // to auth
      } else if (code === 200) {
        resolve(resp)
      } else {
        reject(resp)
      }
    }).catch((e) => {
      if (context) {
        let loadingCount = context.dataset._loadingCount || 0
        context.dataset._loadingCount = --loadingCount
        if (loadingCount <= 0) {
          context.classList.remove('loading')
          delete options.context
        }
      }
      reject(e)
    })
  })
  promise.cancel = (msg) => {
    cancel(msg)
  }
  return promise
}

export default {
  get: function (path, params = {}, options = {}) {
    return ajax(path, params, options, 'get')
  },
  post: function (path, params = {}, options = {}) {
    return ajax(path, params, options, 'post')
  }
}
