const path = require('path');
//webpack.functions.js
// const nodeExternals = require('webpack-node-externals');

// module.exports = {
//   externals: [nodeExternals()],
// };

module.exports = {
  entry: './src/server.ts',
  target: 'node',
  // externals: [nodeExternals()],
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
    extensions: [".tsx",".ts",".js",".wasm"],
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  output: {
    filename: 'tiro-server.js',
    path: path.resolve(__dirname, 'build'),
  },
 
};
