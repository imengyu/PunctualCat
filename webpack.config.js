const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

const config = {
  entry: "./src/app.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "app.js"
  },
  target: 'electron-renderer',
  mode: 'development',
  resolve: {
    extensions: ['.js', '.vue', '.json', '.ts'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
      'assets': path.resolve(__dirname, '../src/assets'),
      'jquery': "jquery/src/jquery",
    }
  },
  module: {
    rules: [
      {
        test: /\.(ttf|woff|woff2|eot|otf|svg|node|bmp|png|jpg|jpeg|gif|ico)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 4096,
              outputPath: 'app/',
            }
          }
        ]
      },
      { test: /\.vue$/, use: 'vue-loader' },
      {
        test: /\.css$/, use: [
          { loader: 'vue-style-loader' },
          { loader: 'css-loader' },
        ]
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: [
          {
            loader:'tslint-loader',
            
          }
        ]
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader:'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/],
            }
          }
        ],
      },
      {
        test: /\.(scss|sass)$/, use: [
          { loader: 'vue-style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ]
      },
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: 'html-withimg-loader!./src/app.html',
      filename: 'index.html',
      minify: {
        minifyCSS: true,
        minifyJS: true,
        collapseWhitespace: true,
        removeComments: true
      }
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src/main-process'),
        to: path.resolve(__dirname, 'dist')
      }
    ]),
  ]
};

module.exports = config