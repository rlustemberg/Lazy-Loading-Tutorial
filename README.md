## Lazy loading controllers to improve startup time

### The problem

A complex Titanium mobile application implemented using the Alloy mvc framework might have poor startup performance. From application startup until the moment that the user interface is finally presented on the device screen, a long time interval is experienced, leading to bad UX.

### The cause

The Alloy framework 'eager loads' the UI objects declared it's index.xml view file. These involves all controllers, widgets, models and collections included in index.xml or child controllers declared on it. It means that all the UI objects and all initialization code on the controllers, is run as soon as the alloy.js file has finished it's execution.
All of these code, including UI objects allocation, any business logic invoked when initializing controllers, is run on a single thread, causing a bottleneck. Therefore it'll stay waiting in the execution queue until it's time is due.
No wonder that as the application grows in complexity, longer startup times will be the result unless we address this issue.

 #### Example

 index.js
 ```xml
<Alloy>
	<TabGroup onFocus="focusHandler">
		<Tab title="Tab1">
			<Require id="window1" src="/windowController1"></Require>
		</Tab>
		<Tab title="Tab2">
			<Require id="window2" src="/windowController2"></Require>
		</Tab>
		<Tab title="Tab3">
			<Require id="window3" src="/windowController3"></Require>
		</Tab>
		<Tab title="Tab4">
			<Require id="windo41" src="/windowController4"></Require>
		</Tab>
	</TabGroup>
</Alloy>
```
 Window controlers 1,2,3 & 4
 ```xml
 <Alloy>
	<Window id="window" onFocus="openHandler">
		<ActivityIndicator id="actInd" message="loading..." color="brown"></ActivityIndicator>
		<Require id="heavy" src="/heavyController"></Require>
	</Window>
</Alloy>
 ```

Each one of these controllers instantiate the 'heavyController', which upon initialization it performs cpu intensive cryptographic iterations (using the PBKDF2 algorithm). This implementation of the PBKDF2 algorithm in plain javascript has abysmal performance and it suits us perfectly for reproducing the effect of io and thread blocking code on application responsiveness.

#### Benchmarking

We can easily benchmark application startup by subtracting the time in milliseconds recorded at the beginning of the alloy.js file with the time we record once the `focus` event on the tabgroup is fired.
alloy.js
```javascript
Alloy.Globals.time = {
  startup : new Date().getTime()
};
console.log('startup');
```
index.js
```javascript
function focusHandler(e) {
  Alloy.Globals.time.tabgroup_open = new Date().getTime();
  console.log('startup time', Alloy.Globals.time.tabgroup_open - Alloy.Globals.time.startup);
}
```

The application startup time is around 8 seconds! (running on an iPhone Xs simulator, Macbook Pro 2015, i7, etc, etc).

By the way, this is what `$.heavyController` is doing
```javascript
// Arguments passed into this controller can be accessed via the `$.args` object
// directly or:
const {args} = $, CryptoJS = require('/pbkdf2');
(function constructor(CryptoJS) {

  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  console.debug('salt', salt.toString());
  const key128Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 128 / 32});
  console.debug('key128Bits', key128Bits.toString());
  const key256Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 256 / 32});
  console.debug('key256Bits', key256Bits.toString());
  const key512Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 512 / 32});
  console.debug('key512Bits', key512Bits.toString());
  const key512Bits1000Iterations =
      CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 512 / 32, iterations : 30000});
  console.debug('key512Bits1000Iterations', key512Bits1000Iterations.toString());
  $.trigger('initialisation:ready');
})(CryptoJS);
function alert(message) {
  console.log(message)
}
exports.alert = alert;
```

### The solution

To counter 'eager loading' we implement it's opossite: 'lazy loading'. What is lazy loading?
>Lazy loading is a design pattern commonly used in computer programming to defer initialization of an object until the point at which it is needed

We will lazy load the 'heavyController' in an attempt reduce startup time.
Within the Alloy framework, we do it by no longer declaring the controller on the view xml file, but by instantiating the child controller on the parent's controller file, and adding it to the view hierarchy, on demand.

windowController1.xml (and 2,3,4)

We delete or comment out the declaration of the 'heavyController'
```xml
<Alloy>
	<Window id="window" onFocus="openHandler">
		<ActivityIndicator id="actInd" message="loading..." color="brown"></ActivityIndicator>
		<!--<Require id="heavy" src="/heavyController"></Require>-->
	</Window>
</Alloy>
```

We define a getter for `$.heavyController`

windowController1.js (and 2,3,4)

```javascript
const {args} = $;
let _heavyController;
(function constructor($,_heavyController) {
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
})($,_heavyController);
```

As you can see, the variable `_heavyController` is declared with a `null` value. In the self invoking 'constructor' function, we define a getter for the `$.heavyController` property, which invokes the Alloy controller factory method if `_heavyController` is null and assigning its output to `$.heavyController`.

In the windowController1.xml we declared an event listener for the 'focus' event.

```javascript
function openHandler() {
  //
  _.delay(() => {
    $.heavyController.alert('Window 1');
  }, 0);
}
```

There we invoke a method on the `$.heavyController` object, which will be now instantiated, blocking the main thread (UI Thread) as expected.
How long does it take now between executing alloy.js and showing the tabgroup?

46 milliseconds.
That's a few orders of magnitude less than the original 8000.

Notice that I enclose the invocation of a method on the heavy controller within the underscore `\_.delay` function ( a wrapper around `setTimeout`), which I'm using to pass the invokation to the next cycle of the JS execution loop. This causes the aditional deferring of execution of the controller method, allowing the javascript execution cycle to finish before running the code.

### Wrapping it up

If you experience that an Alloy application has lowsy startup performance,you may consider implementing lazy loading. Look at the way controllers are declared in the `index.xml` file to look for ways to optimize it.
Focus on declared controllers which implement cpu intensive business logic , see if they can be lazy loaded.
View lifecycle events (ie. open, focus, layout events) or user interaction  can be used to trigger the deferred loading of a controller.
Please bear in mind that you need to ensure that any dependencies on the lazy loaded object need to be taken into account in order to avoid race conditions.
Asynchronous invocation of events might cause the controller to be called after the view has been deallocated, leading to application crashes.

#### Reference
The files for this article can be found at https://github.com/rlustemberg/Lazy-Loading-Tutorial
