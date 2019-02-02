
$.index.open();

function focusHandler(e) {
  Alloy.Globals.time.tabgroup_open = new Date().getTime();
  console.log('startup time', Alloy.Globals.time.tabgroup_open - Alloy.Globals.time.startup);
}
