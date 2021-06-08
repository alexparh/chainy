const deserializeFormData = function (form) {
  const obj = {};
  const formData = new FormData(form);
  for (var key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return obj;
};

module.exports = deserializeFormData;
