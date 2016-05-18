import pkg from '../package.json';

export default {
  deploy: {
    ghPages: {
      remoteUrl: "git@github.com:Hypercubed/DEIVA.git",
      branch: "gh-pages"
    }
  },
  pkg: pkg,
  VERSION: pkg.version
};
