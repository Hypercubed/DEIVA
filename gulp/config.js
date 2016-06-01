import pkg from '../package.json';

export default {
  deploy: {
    ghPages: {
      remoteUrl: "git@github.com:Hypercubed/DEIVA.git",
      branch: "gh-pages"
    }
  },
  pkg: pkg,
  template: {
    version: pkg.version,
    title: 'DEIVA',
    google: 'UA-49359515-2',
    webcomponents: false,
    content: `
      <div class="header" ng-include="'common/partials/header.html'"></div>

      <div class="container-fluid">
        <div ng-view=""></div>
      </div>

      <div class="footer" ng-include="'common/partials/footer.html'">
      </div>

      <div growl></div>
    `
  }
};
