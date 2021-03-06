const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsConfigWebpackPlugin = require('ts-config-webpack-plugin');
const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const Sass = require('sass');

module.exports = (env, argv) => ({
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
    watchOptions: {
      poll: true,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    //new BundleAnalyzerPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inlineSource: argv.mode === 'development' ? '' : '.(css)$',
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
    new HtmlWebpackInlineSVGPlugin({
      inlineAll: true,
      svgoConfig: [
        {
          removeViewBox: false,
        },
      ],
    }),
    new TsConfigWebpackPlugin(),
  ],
  optimization: {
    minimizer: [
      new TerserJSPlugin({
        test: /\.js$/,
        exclude: /node_modules/,
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: Sass,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: {
          loader: 'svg-url-loader',
          options: {},
        },
      },
      {
        test: /\.(mp3|png)$/,
        use: {
          loader: 'file-loader',
          query: {
            outputPath: '/static',
            name: '[name].[ext]',
          },
        },
      },
      {
        test: /\.ico$/,
        use: {
          loader: 'file-loader',
          query: {
            outputPath: '/',
            name: '[name].[ext]',
          },
        },
      },
      {
        test: /og-image.png$/,
        use: {
          loader: 'file-loader',
          query: {
            outputPath: '/',
            name: '[name].[ext]',
          },
        },
      },
    ],
  },
});
