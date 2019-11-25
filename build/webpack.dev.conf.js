'use strict'
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const exec = require('child_process').exec;
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const chalk = require('chalk')

const devWebpackConfig = [
  merge(baseWebpackConfig[0], {
    mode: 'development',
    devtool: config.dev.devtool,

    // these devServer options should be customized in /config/index.js
    devServer: {
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': require('../config/dev.env')
      }),  
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/renderer.html',
        filename: 'index.html',
        inject: false,
        minify: {
          minifyCSS: true,
          minifyJS: true,
          collapseWhitespace: true,
          removeComments: true
        }
      }),
      new VueLoaderPlugin(),
    ]
  }), baseWebpackConfig[1]
]

baseWebpackConfig[1].mode = 'development'

let electronStarted = false

module.exports = new Promise((resolve, reject) => {

  devWebpackConfig[1].plugins.push({
    apply: (compiler) => {
      compiler.hooks.done.tap('StartElectron', compilation => {
        if(!electronStarted) {
          electronStarted = true;

          console.log(chalk.green('Staring electron'));
          setTimeout(() => {
           
            exec(`cross-env NODE_ENV=developnment electron ./dist`, (error, stdout, stderr) => {
              if(error) {
                console.log(chalk.yellow('Can not start electron'));
                console.log(chalk.red(error));
                electronStarted = false;
                return;
              }
              console.log(chalk.yellow('Electron quited'));
              electronStarted = false;
            });
          }, 2000)
        }
      });
    }
  })
  
  resolve(devWebpackConfig)
 
})