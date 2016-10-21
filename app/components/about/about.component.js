import headerHTML from 'common/partials/header.html!text';
// import footerHTML from 'common/partials/footer.html!text';

import template from './readme.md!';
import './about.css!';

export default {
  template: `${headerHTML}${template}`
};
