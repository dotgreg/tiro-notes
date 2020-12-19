var path = require('path');
const webpack = require('webpack'); 
const env = 'development'
// const httpsEnabled = process.env.HTTPS_ENABLED.trim() === 'true' ? true : false
const httpsEnabled = false

module.exports = {
    entry: './src/index.tsx',
    mode: env || 'development',
    devServer: {
        contentBase: './',
        hot: true,
        inline: true,
        host: '0.0.0.0',
        port: 8082,
        https: httpsEnabled,
        watchOptions: {
            poll: true
        }
    },
    // watch: true,
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.tsx', '.ts', '.js']
    },
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
        ],
        
    },
    plugins: [
        new webpack.DefinePlugin({
          "process.env": {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production') // default value if not specified
          }
        }),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: 'js/'
    }
};
