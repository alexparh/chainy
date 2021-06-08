# Chainy

Chainy is super light-weight http client for Node.js. Crafted for flexibilitya and readability.

     chainy
       .post('/api/user')
       .set('X-API-Key', 'someapikey')
       .set('Accept', 'application/json')
       .send({ name: 'Alex', age: '20'  })
       .then(res => {
          alert('got something:' + JSON.stringify(res.body));
       });

or using async/await:

    (async () => {
      const response = await chainy.post('/api/user')
                              .set('X-API-Key', 'someapikey')
                              .set('Accept', 'application/json')
                              .send({ name: 'Alex', age: '20'  })
      console.log(chainy)
    })();

## Basics

A request can be initiated by invoking the appropriate method on the `chainy` object, then calling `.send()` to send the request. For example a simple **GET** request:

     chainy
       .get('/api')
       .send()
       .then(res => {
          // res.body, res.headers, res.status
       })
       .catch(err => {
          // err.message, err.response
       });

Absolute URLs can be used. In web browsers absolute URLs work only if the server implements [CORS](#cors).

     chainy
       .get('https://example.com/search')
       .then(res => {
         // res
       });

## Setting header fields

Setting header fields is simple, invoke `.set()` with name and value:

     chainy
       .get('/search')
       .set('API-Key', 'someapikey')
       .set('Accept', 'application/json')
       .send(data);

Also, you can pass an object to set several fields in a single call:

     chainy
       .get('/search')
       .set({ 'API-Key': 'someapikey', Accept: 'application/json' })
       .send(data);

## `GET` requests

The `.query()` method accepts objects, which when used with the **GET** method will form a query-string. The following will produce the path `/api?name=Alex&age=20&order=desc`.

     chainy
       .get('/api')
       .query({ name: 'Alex' })
       .query({ age: '20' })
       .query({ order: 'desc' })
       .send(data);

Or as a single object:

    chainy
      .get('/api')
      .query({ name: 'Alex', age: '20', order: 'desc' })
      .send(data);

The `.query()` method accepts strings as well:

      chainy
        .get('/api')
        .query('name=Alex&age=19')
        .send(data);

Or joined:

      chainy
        .get('/api')
        .query('name=Alex')
        .query('age=20')
        .send(data);

## `HEAD` requests

You can also use the `.query()` method for HEAD requests. The following will produce the path `/users?email=sasha.parh@gmail.com`:

      chainy
        .head('/users')
        .query({ email: 'sasha.parh@gmail.com' })
        .send(data);

## `POST` / `PUT` requests

A typical JSON **POST** request, where we set the Content-Type header field appropriately, and "write" some data.

      chainy
        .post('/user')
        .set('Content-Type', 'application/json')
        .send('{"name":"Alex","age":"20"}');

Since JSON is undoubtedly the most common, it's the default! The following example is equivalent to the previous.

      chainy
        .post('/user')
        .send(data);

By default sending strings will set the `Content-Type` to `application/x-www-form-urlencoded`:

      chainy
        .post('/user')
        .send('name=Alex&age=20');

## Setting the `Content-Type`

The obvious solution is to use the `.set()` method:

     chainy
        .post('/api')
        .set('Content-Type', 'application/json')

As a short-hand the `.type()` method is also available, accepting
the canonicalized MIME type name complete with type/subtype, or
simply the extension name such as "xml", "json", "png", etc:

     chainy.post('/user')
       .type('form')
       .send(formData);

     chainy.post('/user')
       .type('json')
       .send(jsonData);

     chainy.post('/user')
       .type('png')
       .send(pngData);

## Serializing request body

Chainy will automatically serialize objects to JSON, XML and forms using `.type()` + `.serialize()` methods:

     chainy.post('/user')
       .type('json')
       .serialize()
       .send(objectData);

## Retrying requests

When given the `.retry()` method, Chainy will automatically retry requests, if they fail in a way that is transient or could be due to a flaky Internet connection.

This method has two optional arguments: number of retries (default 1) and a callback. It calls `callback(err, res)` before each retry. The callback may return `true`/`false` to control whether the request should be retried (but the maximum number of retries is always applied).

     chainy
       .get('https://example.com/search')
       .retry(2) // or:
       .retry(2, callback)
       .send();

Use `.retry()` only with requests that are _idempotent_ (i.e. multiple requests reaching the server won't cause undesirable side effects like duplicate purchases).

All request methods are tried by default (which means if you do not want POST requests to be retried, you will need to pass a custom retry callback).

By default the following status codes are retried:

- `408`
- `413`
- `429`
- `500`
- `502`
- `503`
- `504`
- `521`
- `522`
- `524`

By default the following error codes are retried:

- `'ETIMEDOUT'`
- `'ECONNRESET'`
- `'EADDRINUSE'`
- `'ECONNREFUSED'`
- `'EPIPE'`
- `'ENOTFOUND'`
- `'ENETUNREACH'`
- `'EAI_AGAIN'`

## Deserializing response body

You can deserialize data using `.accept()` method. It`s allowing you to specify "xml", "json", "form".

     chainy.get('/user')
       .accept('json')
       .send();

## TLS options

In Node.js Сhainy supports methods to configure HTTPS requests:

- `.ca()`: Set the CA certificate(s) to trust
- `.cert()`: Set the client certificate chain(s)
- `.key()`: Set the client private key(s)
- `.pfx()`: Set the client PFX or PKCS12 encoded private key and certificate chain
- `.disableTLSCerts()`: Does not reject expired or invalid TLS certs. Sets internally `rejectUnauthorized=true`. _Be warned, this method allows MITM attacks._

```js
const key = fs.readFileSync('key.pem'),
  cert = fs.readFileSync('cert.pem');

chainy.post('/client-auth').key(key).cert(cert).send(data).then(callback);
```

```js
const ca = fs.readFileSync('ca.cert.pem');

chainy
  .post('https://localhost/private-ca-server')
  .ca(ca)
  .send(data)
  .then((res) => {});
```

### Multipart

The Node client supports _multipart/form-data_ via the [Formidable](https://github.com/felixge/node-formidable) module. When parsing multipart responses, the object `res.files` is also available to you. Suppose for example a request responds with the following multipart body:

    --whoop
    Content-Disposition: attachment; name="image"; filename="tobi.png"
    Content-Type: image/png

    ... data here ...
    --whoop
    Content-Disposition: form-data; name="name"
    Content-Type: text/plain

    Tobi
    --whoop--

You would have the values `res.body.name` provided as "Tobi", and `res.files.image` as a `File` object containing the path on disk, filename, and other properties.

## Response properties

Many helpful flags and properties are set on the `Response` object, ranging from the response text, parsed response body, header fields, status flags and more.

### Response body

Much like Сhainy can auto-serialize request data, it can also automatically parse it with
`.accept` method. Object is available via `res.body`.

### Response header fields

The `res.header` contains an object of parsed header fields, lowercasing field names much like node does. For example `res.header['content-length']`.

### Response Content-Type

The Content-Type response header is special-cased, providing `res.type`, which is void of the charset (if any). For example the Content-Type of "text/html; charset=utf8" will provide "text/html" as `res.type`, and the `res.charset` property would then contain "utf8".

### Response status

The response status flags help determine if the request was a success, among other useful information, making Chainy ideal for interacting with RESTful web services.

## Timeouts

Sometimes networks and servers get "stuck" and never respond after accepting a request. Set timeouts to avoid requests waiting forever.

- `req.timeout({deadline:ms})` or `req.timeout(ms)` (where `ms` is a number of milliseconds > 0) sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete. If the response isn't fully downloaded within that time, the request will be aborted.

- `req.timeout({response:ms})` sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the entire download can take. Response timeout should be at least few seconds longer than just the time it takes the server to respond, because it also includes time to make DNS lookup, TCP/IP and TLS connections, and time to upload request data.

You should use both `deadline` and `response` timeouts. This way you can use a short response timeout to detect unresponsive networks quickly, and a long deadline to give time for downloads on slow, but reliable, networks. Note that both of these timers limit how long _uploads_ of attached files are allowed to take. Use long timeouts if you're uploading files.

    chainy
      .get('/big-file?network=slow')
      .timeout({
        response: 5000,  // Wait 5 seconds for the server to start sending,
        deadline: 60000, // but allow 1 minute for the file to finish loading.
      })
      .then(res => {
          /* responded in time */
        }, err => {
          if (err.timeout) { /* timed out! */ } else { /* other error */ }
      });

Timeout errors have a `.timeout` property.

## Following redirects

By default up to 5 redirects will be followed, however you may specify this with the `res.redirects(n)` method:

    const response = await request.get('/some.png').redirects(2);

Redirects exceeding the limit are treated as errors. Use `.ok(res => res.status < 400)` to read them as successful responses.

## Piping data

The Node client allows you to pipe data to and from the request. Please note that `.pipe()` is used **instead of** `.send()` method.

For example piping a file's contents as the request:

    const chainy = require('chainy-request');
    const fs = require('fs');

    const stream = fs.createReadStream('file/path/my.json');
    const req = chainy.post('/somewhere').type('json');
    stream.pipe(req);

Or piping the response to a file:

    const stream = fs.createWriteStream('path/to/my.json');
    const req = chainy.get('/some.json');
    req.pipe(stream);

## Multipart requests

Chainy is also great for _building_ multipart requests for which it provides methods `.attach()` and `.field()`.

When you use `.field()` or `.attach()` you can't use `.send()` and you _must not_ set `Content-Type` (the correct type will be set for you).

### Attaching files

To send a file use `.attach(name, filePath)`. You can attach multiple files by calling `.attach` multiple times. The arguments are:

- `name` — field name in the form.
- `filePath` — either string with file path.

  chainy
  .post('/uploadSomtheing')
  .attach('image1', 'path/to/felix.jpeg')
  .attach('image2', 'luna.jpeg')
  .send();

## CORS

For security reasons, browsers will block cross-origin requests unless the server opts-in using CORS headers. Browsers will also make extra **OPTIONS** requests to check what HTTP headers and methods are allowed by the server. [Read more about CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS).

The `.withCredentials()` method enables the ability to send cookies from the origin, however only when `Access-Control-Allow-Origin` is _not_ a wildcard ("\*"), and `Access-Control-Allow-Credentials` is "true".

    chainy
      .get('https://api.example.com:4001/')
      .withCredentials()
      .send()
      .then(res => {
        assert.equal(200, res.status);
        assert.equal('tobi', res.text);
      })
