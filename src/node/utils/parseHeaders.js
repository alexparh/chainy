const parseHeaders = (rawHeaders) => {
  const headers = [];
  if (typeof rawHeaders === 'object') {
    for (i = 0; i < rawHeaders.length; i += 2) {
      headers.push({ [rawHeaders[i]]: rawHeaders[i + 1] });
    }
  }
  return headers;
};

module.exports = parseHeaders;
