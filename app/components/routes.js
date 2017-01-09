import angular from 'angular';

import 'ui-select/dist/select';
import 'ui-select/dist/select.css!';

import grid from 'common/services/grid/grid';
import slider from 'common/directives/slider/index';
import intro from './intro/index';

import scatterComponent from './scatter/scatter.component';
import aboutComponent from './about/about.component';

import 'spectrum-colorpicker';
import 'spectrum-colorpicker/spectrum.css!';
import 'angular-spectrum-colorpicker';

configRoute.$inject = ['$routeProvider'];
function configRoute ($routeProvider) {
  $routeProvider
    .when('/about', {
      template: '<about></about>'
    })
    .when('/error', {
      templateUrl: 'components/error/error.html'
    })
    .when('/404', {
      templateUrl: 'components/error/error.html'
    })
    .when('/', {
      template: `<scatter data-package="$resolve.dataPackage"></scatter>`,
      datapackageUrl: 'data/datapackage.json'
    })
    .otherwise({redirectTo: '/'});
}

export default angular
  .module('routes', [
    grid,
    intro,
    'ui.select',
    'angularSpectrumColorpicker',
    slider
  ])
  .component('scatter', scatterComponent)
  .component('about', aboutComponent)
  .config(configRoute)
  .name;
