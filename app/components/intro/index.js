import angular from 'angular';

import 'intro.js/introjs.css!';
import './intro.less!';

import 'angular-intro.js';

import steps from './intro-data.js';
import hello from './intro.md!';
import thankYou from './intro-end.md!';

steps[0].intro = hello;
steps[steps.length - 1].intro = thankYou;

// setup intro
export const introOptions = {
  steps,
  showStepNumbers: false,
  exitOnOverlayClick: true,
  exitOnEsc: true
};

export default angular
  .module('intro', ['angular-intro'])
  .name;
