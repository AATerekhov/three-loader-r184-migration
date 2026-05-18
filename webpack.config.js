const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'potree.mjs',
    chunkFilename: '[id].potree.mjs',
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
  devtool: 'eval-cheap-source-map',
  stats: 'errors-only',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  externalsType: 'module',
  externals: {
    three: 'three',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },

      { test: /\.(vs|fs|glsl|vert|frag)$/i, type: 'asset/source' },
    ],
  },
  plugins: [],
};
