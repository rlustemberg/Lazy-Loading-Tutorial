// Arguments passed into this controller can be accessed via the `$.args` object
// directly or:
const {args} = $;
let _heavyController;
(function constructor() {
  $.actInd.show();
  Object.defineProperty($, 'heavyController', {
    get() {
      if (!_heavyController) {

        _heavyController = Alloy.createController('/heavyController');
        $.window.add(_heavyController.getView());
        _heavyController.on('initialisation:ready', () => {
          $.actInd.hide();
        });
      }
      return _heavyController;
    }
  });
})();
function openHandler() {
  //
  _.delay(() => {
    $.heavyController.alert('Window 4');
  }, 0);
}
