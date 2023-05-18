module.exports = {
    // アプリケーションのコンテキスト（基準となるディレクトリ）を指定
    context: __dirname + '/app',

    // エントリーポイントとなるファイルを指定
    entry: {
        'index/': './entry.js'
    },
    output: {
        // バンドルされたJavaScriptファイルの出力先ディレクトリ
        path: __dirname + '/public/javascripts',
        // 出力されるバンドルファイルの名前
        filename: '[name]bundle.js'
    },
    // バンドルのモード
    mode: 'none',
    module: {
        rules: [{
            test: /\.js$/,
            // バベルの処理を適用しないディレクトリ
            exclude: /node_modules/,
            use: {
                // Babelを使用するためのローダー
                loader: 'babel-loader',
                options: {
                    // Babelのプリセット
                    // '@babel/preset-env'は、BabelがECMAScript最新仕様をサポートするためのプリセット
                    presets: ['@babel/preset-env']
                }
            }
        }]
    },
    target: 'web',
    resolve: {
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "path": require.resolve("path-browserify"),
            "zlib": require.resolve("browserify-zlib"),
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "url": require.resolve("url/"),
            "querystring": require.resolve("querystring-es3"),
            "timers": require.resolve("timers-browserify"),
            "assert": require.resolve("assert/"),
            "buffer": require.resolve("buffer/"),
            "util": require.resolve("util/"),
            "os": require.resolve("os-browserify/browser")
        }
    }
};