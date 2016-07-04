import './scatter.css!';

import template from './scatter.html!text';
import controller from './scatter.controller';

export default {
  controller,
  template,
  controllerAs: 'main',
  bindings: {
    dataPackage: '<package'
  }
};
