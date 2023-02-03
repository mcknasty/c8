const cjs = require('./export.cjs')

module.exports = () => 'baz' + cjs();
