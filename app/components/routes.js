import angular from 'angular';

import component from './scatter/scatter';

import aboutHTML from 'components/about/readme.md!';
import 'components/about/about.css!';

import errorHTML from 'components/error/error.html!text';

import 'ui-grid';
import 'ui-grid/ui-grid.css!';

import 'ui-select/dist/select';
import 'ui-select/dist/select.css!';

import angularSlider from 'angular-slider';
import 'angular-slider/dist/rzslider.css!';
import './scatter/slider.css!';

import 'intro.js/introjs.css!';
import 'angular-intro.js';

export default angular
  .module('routes', [
    'projectX.dataService',
    'projectX.dataEditor',
    'ui.grid',
    'ui.grid.exporter',
    'ui.grid.resizeColumns',
    'ui.select',
    'angular-loading-bar',
    'angular-intro',
    'svgDownloadDropdown',
    angularSlider.name])
  .component('scatter', component)
  .config(['$routeProvider', $routeProvider => {
    $routeProvider
    .when('/about', {
      template: `<div class="markdown-body">${aboutHTML}</div>`
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
  }]);
