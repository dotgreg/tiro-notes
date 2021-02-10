const path = require('path');

module.exports = {
  entry: './src/server.ts',
  target: 'node',
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
    extensions: [ '.tsx', '.ts', '.js' ],
    // fallback: {
    //     "fs": false,
    //     "tls": false,
    //     "net": false,
    //     "worker_threads": false,
    //     "path": false,
    //     "assert": false,
    //     "child_process": false,
    //     "url": false,
    //     "querystring": false,
    //     "util": false,
    //     "os": false,
    //     "buffer": false,
    //     "zlib": false,
    //     "http": false,
    //     "https": false,
    //     "stream": false,
    //     "crypto": false,
    //   } 
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'build'),
  },
 
};