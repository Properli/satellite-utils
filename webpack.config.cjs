const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      //assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      //console: require.resolve('console-browserify'),
      //constants: require.resolve('constants-browserify'),
      //crypto: require.resolve('crypto-browserify'),
      //domain: require.resolve('domain-browser'),
      //events: require.resolve('events'),
      //http: require.resolve('stream-http'),
      //https: require.resolve('https-browserify'),
      //os: require.resolve('os-browserify/browser'),
      //path: require.resolve('path-browserify'),
      //punycode: require.resolve('punycode'),
      //process: require.resolve('process/browser'),
      //querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      //string_decoder: require.resolve('string_decoder'),
      //sys: require.resolve('util'),
      //timers: require.resolve('timers-browserify'),
      //tty: require.resolve('tty-browserify'),
      //url: require.resolve('url'),
      //util: require.resolve('util'),
      //vm: require.resolve('vm-browserify'),
      //zlib: require.resolve('browserify-zlib'),
    },
  },
  output: {
    filename: 'creatorsLib.js',
    path: path.resolve(__dirname, 'lib'),
    globalObject: 'this'
  },
  externals: {
    'argon2':'commonjs argon2',
  },
  //target: 'node'
};