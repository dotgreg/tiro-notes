var path = require('path');

module.exports = {
    entry: './src/game.ts',
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.tsx', '.ts', '.js']
    },
    module: {
        rules: [
            { test: /.ts(x?)$/, loader: 'ts-loader' }
        ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'build/dist'),
    }
};
