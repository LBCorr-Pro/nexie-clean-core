const nextEslintConfig = require('eslint-config-next');

nextEslintConfig.rules = {
  ...nextEslintConfig.rules,
  'react-hooks/exhaustive-deps': ['warn', {
    'additionalHooks': '(useTranslations)'
  }]
};

module.exports = nextEslintConfig;
