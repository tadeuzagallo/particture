module.exports = {
  entry: './js/app.es6.js',
  output: {
    path: './build',
    filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.es6.js$/, loader: '6to5' }
    ]
  }
};
