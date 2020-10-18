import 'whatwg-fetch'

export default (nodefony) => {

  const defaultOptions = {
    fetch: {
      credentials: 'include',
      headers: {
        "Accept": 'application/json',
        "Content-Type": "application/json",
        "User-Agent": "nodefony-client"
      }
    },
    tokenName: "jwt",
    storage: {}
  }

  class Api extends nodefony.Storage {

    constructor(name = "api", baseUrl = "", options = {}, service = null) {
      super(name, nodefony.extend(true, {}, defaultOptions, options), service);
      this.baseUrl = nodefony.url(baseUrl);
      if (this.baseUrl.slashes !== null) {
        if (this.baseUrl.slashes === false) {
          this.baseUrl = nodefony.url(`${baseUrl}/`);
        }
      } else {
        if (this.baseUrl.href) {
          let slash = this.baseUrl.href[this.baseUrl.href.length - 1];
          if (slash !== "/") {
            this.baseUrl = nodefony.url(`${baseUrl}/`);
          }
        }
      }
      this.defaultOptions = this.options.fetch;
      console.log(this)
    }

    get token() {
      return super.token;
    }

    set token(value) {
      super.token = value;
    }

    http(url, method = "get", options = this.defaultOptions) {
      if (!url) {
        throw new Error(`No url defined`);
      }
      let myurl = null;
      if (this.baseUrl.href) {
        myurl = nodefony.URL.resolve(this.baseUrl.href, url);
      } else {
        myurl = url;
      }
      let opt = nodefony.extend(true, {
        method,
        body: null,
        headers: {}
      }, options);
      const myHeaders = new Headers();
      if (this.token) {
        myHeaders.append(this.options.tokenName, this.token);
      }
      if (opt.headers) {
        for (let header in opt.headers) {
          myHeaders.append(header, opt.headers[header]);
        }
      }
      opt.headers = myHeaders;
      this.log(myurl, "DEBUG");
      this.log(opt, "DEBUG");
      return fetch(myurl, opt)
        .then(async (response) => {
          try {
            if (response.ok) {
              return response.json();
            }
            let error = new Error(response.statusText);
            error.response = await response.json();
            throw error;
          } catch (error) {
            if (!error.response) {
              error.response = response;
            }
            throw error;
          }
        })
        .catch(async (error) => {
          if (error.response && error.response.status === 401) {
            if (error.response.statusText === "jwt expired") {
              return this.getToken()
                .then(() => {
                  return this.http(url, method, opt);
                })
                .catch((e) => {
                  throw e;
                });
            }
          }
          throw error;
        });
    }
    get(url, options = this.defaultOptions) {
      return this.http(url, "get", options);
    }
    post(url, options = this.defaultOptions) {
      return this.http(url, "post", options);
    }
    put(url, options = this.defaultOptions) {
      return this.http(url, "put", options);
    }
    delete(url, options = this.defaultOptions) {
      return this.http(url, "delete", options);
    }

    login(url = "/api/jwt/login", username = null, passwd = null, options = this.defaultOptions) {
      let opt = nodefony.extend({}, options, {
        body: JSON.stringify({
          username,
          passwd
        })
      });
      return this.post(url, opt)
        .then(response => {
          this.token = response.result.token;
          this.refreshToken = response.result.refreshToken;
          return response;
        })
        .catch((error) => {
          this.clearToken(true);
          throw error.response || error;
        });
    }

    logout(url = "/api/jwt/logout", refreshToken = this.refreshToken, options = this.defaultOptions) {
      let opt = nodefony.extend({}, options, {
        body: JSON.stringify({
          refreshToken
        })
      });
      return this.post(url, opt)
        .then(response => {
          this.clearToken(true);
          return response;
        })
        .catch((error) => {
          this.clearToken(true);
          throw error;
        });
    }

    getToken(url = "/api/jwt/token", options) {
      let opt = nodefony.extend({}, options, {
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });
      return this.post(url, opt)
        .then(response => {
          this.token = response.result.token;
          return response;
        })
        .catch((error) => {
          this.clearToken(true);
          throw error;
        });
    }
  }
  return nodefony.Api = Api;
}
