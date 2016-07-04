import pkg from '../package.json';

export default {
  deploy: {
    ghPages: {
      remoteUrl: 'git@github.com:Hypercubed/DEIVA.git',
      branch: 'gh-pages'
    }
  },
  pkg,
  template: {
    version: pkg.version,
    title: 'DEIVA',
    google: 'UA-49359515-2',
    webcomponents: false
  }
};
