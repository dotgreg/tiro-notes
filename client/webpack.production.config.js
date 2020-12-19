var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')


module.exports = {
  entry: {
    app: [
      path.resolve(__dirname, 'src/index.tsx')
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: './',
    filename: 'js/bundle.js'
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html',
      // chunks: ['vendor', 'app'],
      // chunksSortMode: 'manual',
      // minify: {
      //   removeAttributeQuotes: true,
      //   collapseWhitespace: true,
      //   html5: true,
      //   minifyCSS: false,
      //   minifyJS: false,
      //   minifyURLs: false,
      //   removeComments: false,
      //   removeEmptyAttributes: true
      // },
      hash: true
    })
  ],
  module: {
    rules: [
      { test: /.ts(x?)$/, loader: 'ts-loader' },
      {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
      },
      {
          test: /\.(ttf|eot|woff|woff2)$/,
          loader: 'file-loader',
          options: {
              name: 'fonts/[name].[ext]'
          }
      }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    extensions: ['.ts','.tsx', '.js'],
  }
}