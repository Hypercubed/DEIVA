import footerHTML from 'common/partials/footer.html!text';
// import headerHTML from 'common/partials/header.html!text';

const AppComponent = {
  template: `
    <div class="container-fluid">
      <div ng-view autoscroll class="ng-fade"></div>
    </div>

    <div class="footer">
      ${footerHTML}
    </div>

    <div growl></div>`
};

export default AppComponent;
