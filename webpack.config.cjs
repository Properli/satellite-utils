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
  },
  output: {
    filename: 'creatorsLib.js',
    path: path.resolve(__dirname, 'lib'),
    globalObject: 'this'
  },
  externals: {
    'argon2':'commonjs argon2',
  }
};