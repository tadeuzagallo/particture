module.exports = {
  entry: './src/app.js',
  output: {
    path: './build',
    filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.js/, loader: '6to5' }
    ]
  }
};
