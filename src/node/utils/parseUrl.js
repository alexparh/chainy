const parseUrl = (url) => {
  try {
    const protocol = (url.split(':')[0] || 'http').toLowerCase();
    const hostname = url.split('/')[2].toLowerCase();
    const path = '/' + url.slice(url.indexOf(url.split('/')[3]));

    return { protocol, hostname, path };
  } catch (err) {
    throw new Error('Incorrect url');
  }
};

module.exports = parseUrl;
