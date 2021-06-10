const https = require('https');
const semver = require('semver');
let http;
if (semver.gte(process.version, 'v10.10.0')) http2 = require('http2');
else http = require('http');

const xml2js = require('xml2js');
const form = require('object-to-formdata');
const parseUrl = require('./utils/parseUrl');
const parseHeaders = require('./utils/parseHeaders');
const deserializeFormData = require('./utils/deserializeFormData');
const defaultStatusCodesToRetry = require('./utils/defaultStatusCodesToRetry');
const defaultErrorCodesToRetry = require('./utils/defaultErrorCodesToRetry');

function Requst(url, method) {
  this.url = url;
  this.method = method;
  this.headers = {};
  this.dataType = '';
  this.queryStr = '?';
  this.serialize = false;
  this.retryCount = 0;

  query = (query) => {
    if (typeof query === 'string') {
      this.queryStr += `${query}&`;
    } else if (typeof query === 'object') {
      for (let i = 1; i > params.length; i += 2) {
        const params = query.split('"').filter(val, (i) => i % 2);
        this.queryStr += `${params[i]}=${params[i + 1]}&`;
      }
    }
    return Object.freeze({ send: this.send, set: this.set, query: this.query });
  };

  set = (obj, value) => {
    if (typeof obj === 'object' && !value) {
      Object.assign(this.headers, obj);
    } else {
      Object.assign(this.headers, { [obj]: value });
    }
    return Object.freeze({ send: this.send, set: this.set, query: this.query });
  };

  type = (dataTypeStr) => {
    switch (dataTypeStr) {
      case 'form':
        Object.assign(this.headers, { 'Content-type': 'application/x-www-form-urlencoded' });
        this.dataType = 'form';
        break;

      case 'json':
        Object.assign(this.headers, { 'Content-type': 'application/json' });
        this.dataType = 'json';
        break;

      case 'png':
        Object.assign(this.headers, { 'Content-type': 'image/png' });
        break;

      case 'gif':
        Object.assign(this.headers, { 'Content-type': 'image/gif' });
        break;

      case 'jpeg':
      case 'jpg':
        Object.assign(this.headers, { 'Content-type': 'image/jpeg' });
        break;

      case 'xml':
        Object.assign(this.headers, { 'Content-type': 'application/xml' });
        this.dataType = 'xml';
        break;
    }
    return Object.freeze({ send: this.send, set: this.set, query: this.query, serialize: this.serialize });
  };

  serialize = () => {
    this.serialize = true;
    return Object.freeze({ send: this.send, set: this.set, query: this.query, serialize: this.serialize });
  };

  accept = (dataTypeStr) => {
    this.deserialize = dataTypeStr;
    return Object.freeze({ send: this.send, set: this.set, query: this.query, serialize: this.serialize });
  };

  retry = (count, cb) => {
    this.retryCount = count;
    this.retryCallBack = cb;
    return Object.freeze({ send: this.send, set: this.set, query: this.query, serialize: this.serialize });
  };

  send = (data) => {
    //add if data check
    let readyData = data;

    if (data) {
      const setDeafaults = () => {
        if (typeof data === 'object' && !this.headers['Content-type']) {
          //set default type of data - json
          Object.assign(this.headers, { 'Content-type': 'application/json' });
        } else if (typeof data === 'string' && !this.headers['Content-type']) {
          //set default type of data - form
          Object.assign(this.headers, { 'Content-type': 'application/x-www-form-urlencoded' });
        }
      };

      const serialize = () => {
        let serializedData = data;
        if (this.serialize && typeof data === 'object') {
          switch (this.dataType) {
            case 'xml':
              const builder = new xml2js.Builder();
              serializedData = builder.buildObject(data);
              break;

            case 'json':
              serializedData = JSON.stringify(data);
              break;

            case 'form':
              serializedData = form.serialize(data);
              break;
          }
        }

        return serializedData;
      };

      setDeafaults();
      readyData = serialize();
    }

    const { protocol, hostname, path } = parseUrl(url);

    const _http = protocol === 'https' ? https : http;

    const options = {
      protocol: protocol === 'https' ? 'https:' : 'http:',
      hostname: hostname,
      port: protocol == 'https' ? 443 : 80,
      path: this.queryStr !== '?' ? path + this.queryStr.slice(0, -1) : path,
      method: this.method.toUpperCase(),
      headers: this.headers,
    };

    const promisifyRequest = () => {
      return new Promise((resolve, reject) => {
        const req = _http
          .request(options, (res) => {
            let data = '';

            // called when a data chunk is received.
            res.on('data', (chunk) => {
              data += chunk;
            });

            // called when the complete response is received.
            res.on('end', () => {
              if (
                this.retryCount > 0 &&
                ((this.retryCallBack && this.retryCallBack(err, res)) ||
                  defaultStatusCodesToRetry.includes(res.statusCode))
              ) {
                this.retryCount--;
                promisifyRequest()
                  .then((data) => resolve(data))
                  .catch((err) => reject(err));
              } else {
                resolve(Response(res, this, data));
              }
            });
          })
          .on('error', (err) => {
            if (
              this.retryCount > 0 &&
              ((this.retryCallBack && this.retryCallBack(err, res)) || defaultErrorCodesToRetry.includes(err.code))
            ) {
              this.retryCount--;
              promisifyRequest()
                .then((data) => resolve(data))
                .catch((err) => reject(err));
            } else {
              reject(err);
            }
          });

        if (readyData) {
          req.write(readyData);
        }
        req.end();
      });
    };

    return promisifyRequest();
  };

  if (this.method === 'GET' || this.method === 'HEAD') {
    return Object.freeze({ send, set, query, accept, retry });
  } else {
    return Object.freeze({ send, set, accept, retry });
  }
}

function Response(res, req, data) {
  this.headers = parseHeaders(res.rawHeaders);
  this.stastusMessage = res.statusMessage;
  this.status = res.statusCode;
  this.request = req;
  this.body = data;

  if (this.deserialize) {
    let deserializedData = data;
    switch (this.deserialize) {
      case 'xml':
        const parser = new xml2js.Parser();
        deserializedData = parser.parseString(data);
        break;

      case 'json':
        deserializedData = JSON.parse(data);
        break;

      case 'form':
        deserializedData = deserializeFormData(data);
        break;
    }
    this.body = deserializedData;
  }

  return Object.freeze({
    headers: this.headers,
    status: this.status,
    statusMessage: this.stastusMessage,
    body: this.body,
    request: this.request,
  });
}

const Chainy = () => {
  const get = (url) => Requst(url, 'GET');

  const post = (url) => Requst(url, 'POST');

  const del = (url) => Requst(url, 'DELETE');

  const put = (url) => Requst(url, 'PUT');

  const patch = (url) => Requst(url, 'PATCH');

  const head = (url) => Requst(url, 'HEAD');

  const options = (url) => Requst(url, 'OPTIONS');

  return Object.freeze({
    get,
    post,
    put,
    delete: del,
    patch,
    head,
    options,
  });
};

module.exports = Chainy();
