import angular from 'angular';

import errorHTML from 'components/error/error.html!text';

import grid from 'common/services/grid/grid';

import 'ui-select/dist/select';
import 'ui-select/dist/select.css!';

import angularSlider from 'angularjs-slider';
import './scatter/slider.css!';

import 'intro.js/introjs.css!';
import 'angular-intro.js';

import scatterComponent from './scatter/scatter.component';
import aboutComponent from './about/about.component';

configRoute.$inject = ['$routeProvider'];
function configRoute($routeProvider) {
  $routeProvider
    .when('/about', {
      template: '<about></about>'
    })
    .when('/error', {
      template: errorHTML
    })
    .when('/404', {
      template: errorHTML
    })
    .when('/', {
      template: '<scatter data-package="$resolve.dataPackage"></scatter>',
      datapackageUrl: 'data/datapackage.json'
    })
    .otherwise({redirectTo: '/'});
}

const routes = angular
  .module('routes', [
    grid,
    'ui.select',
    'angular-intro',
    angularSlider.name])
  .component('scatter', scatterComponent)
  .component('about', aboutComponent)
  .config(configRoute)
  .name;

export default routes;
