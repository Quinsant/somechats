{
  test: /\.(jpg|png|svg)$/,
  loader: 'url-loader',
  options: {
    limit: 25000,
  },
},
{
    exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /\.wasm$/],
    test: /\.(jpg|png|svg)$/,
    loader: 'file-loader',
    options: {
      name: '[path][name].[hash].[ext]',
    },
}