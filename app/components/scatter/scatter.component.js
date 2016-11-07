import './scatter.less!';

import headerHTML from 'common/partials/header.html!text';

import template from './scatter.html!text';
import controller from './scatter.controller';

export default {
  controller,
  template: headerHTML + template,
  // controllerAs: 'main',
  bindings: {
    dataPackage: '<package'
  }
};
