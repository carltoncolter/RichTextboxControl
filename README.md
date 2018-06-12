CKEditor5 Rich Textbox Control
=======================================================
### A Rich Textbox Control for Dynamics CRM and CDS (PowerApps)



## Quick start

First, fork the project or download the source, etc.  Run npm install to install dependencies.

```
npm install
```

And then run the build to create the solution zip file:

```
npm run build
```

Upload the solution to Dynamics.  Then you can use it as acustom control on any multi-lined textbox.

## How does it work

1. First the control is leveraging ckeditor5 as the control to embed.  The RickTextBoxControl.ts binds the editor to CRM.  The most important parts of this are:
  * the code in _onChange that sets the `context.parameters.value.raw = data`.
  * `notifyOutputChanged` is used to notify the system the value was updated.  Once the data in your control has been changed, you need to fire `notifyOutputChanged`.
  * the `init` code is probably the most important because it not only builds the dom portion of the control inside of the specified container, it also binds the `notifyOutputChanged` to the client, allowing you to tell the client that your control changed the `context.parameters.value`.
  * `updateView` is ran anytime something else updates the value (like using the Client Side API).
2. The control is intentionally log heavy on the console.  It logs the beginning of each method that was called, allowing you to see what happened in order of execution on the console.  If you are going to develop your own control, seeing the order of execution may help your understanding.

## License

CKeditor5 is licensed under the GPL, LGPL and MPL licenses, at your choice. Webpack & Babel are licensed under the MIT license.  All of the other source code for this project can be licensed under the MIT License as well as the GPL License.  For full details about the license, please check the [LICENSE.md](https://github.com/carltoncolter/ckeditor5-dynamics365/blob/master/LICENSE.md) file.
