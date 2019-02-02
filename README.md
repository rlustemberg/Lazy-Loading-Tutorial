## Lazy loading controllers to improve startup time

### The problem

A Titanium mobile application implemented using the Alloy mvc framework has poor startup performance. From application startup until the moment that the user interface is finally presented on the device screen, a long time interval is experienced, leading to bad UX.

### The cause

The Alloy mvc framework 'eager loads' the code which is declared on it's xml view files and corresponding controllers. This means that all the UI objects and all initialization code on the controllers, is run as soon as the alloy.js file has finished it's execution.
All of these code, including UI objects allocation, any business logic invoked when initializing controllers, is run on a single thread. Therefore it'll stay waiting in the execution queue until it's time is due. Bear in mind that when a view file requires controllers, those controllers and the controllers they themselves might require are created recursively.
No wonder that as the application grows in complexity, longer startup times will be the result unless we address this issue.

### The solution

To counter 'eager loading' we implement it's opossite: 'lazy loading'. What is lazy loading?
