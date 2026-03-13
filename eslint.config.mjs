import treeSitterConfig from 'eslint-config-treesitter';

export default [
  ...treeSitterConfig,
  {
    rules: {
      'max-len': [
        'error',
        {
          code: 160,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreRegExpLiterals: true
        },
      ],
    },
  },
];
