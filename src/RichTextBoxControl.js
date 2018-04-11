var FDBZAP;
(function (FDBZAP) {
    var Controls;
    (function (Controls) {
        var TextComparer = (function () {
            function TextComparer() {
                this._isRunning = false;
            }
            TextComparer.prototype.update = function (data) {
                this.value = data.toString();
            };
            TextComparer.prototype.compareTo = function (data, saveIfDifferent) {
                if (this.value.length !== data.length) {
                    return false;
                }
                if (this.value === data) {
                    return true;
                }
                if (saveIfDifferent) {
                    this.value = data;
                }
                return false;
            };
            TextComparer.prototype.hashCode = function (data) {
                var hash = 0;
                if (!data) {
                    return hash;
                }
                for (var i = 0; i < data.length; i++) {
                    var chr = data.charCodeAt(i);
                    hash = ((hash << 5) - hash) + chr;
                    hash |= 0;
                }
                return hash;
            };
            return TextComparer;
        }());
        Controls.TextComparer = TextComparer;
        var RichTextBoxControl = (function () {
            function RichTextBoxControl() {
                this.error = null;
                console.log("RichTextBoxControl.constructor");
                this.comparer = new TextComparer();
                this.gettingOutput = false;
            }
            Object.defineProperty(RichTextBoxControl.prototype, "isCurrentlyBeingEdited", {
                get: function () {
                    return (this.editor && this.editor.data && this.editor.ui.focusTracker.isFocused);
                },
                enumerable: true,
                configurable: true
            });
            RichTextBoxControl.prototype.isDirty = function () {
                console.log("RichTextBoxControl.isDirty");
                return this.isCurrentlyBeingEdited || this._isDirtyValue();
            };
            RichTextBoxControl.prototype._isDirtyValue = function () {
                console.log("RichTextBoxControl._isDirtyValue");
                if (this.editor) {
                    return this.dirty || this.comparer.compareTo(this.context.parameters.value.raw);
                }
                return false;
            };
            RichTextBoxControl.prototype.renderReadMode = function () {
                console.log("RichTextBoxControl.renderReadMode");
                this.disableControlInteraction();
            };
            RichTextBoxControl.prototype.renderEditMode = function () {
                console.log("RichTextBoxControl.renderEditMode");
            };
            RichTextBoxControl.prototype.isError = function () {
                console.log("RichTextBoxControl.isError");
                return (this.error !== null);
            };
            RichTextBoxControl.prototype.setControlState = function (context) {
                console.log("RichTextBoxControl.setControlState");
                this.shouldNotifyOutputChanged = !(context.mode.isControlDisabled || !context.parameters.value.security.editable || context.page && context.page.isPageReadOnly);
                if (!this.shouldNotifyOutputChanged) {
                    this.disableControlInteraction();
                }
                else {
                    this.enableControlInteraction();
                }
            };
            RichTextBoxControl.prototype.isControlDisabled = function () {
                console.log("RichTextBoxControl.isControlDisabled");
                if (this.editor) {
                    return this.editor.isReadOnly;
                }
                else {
                    return this.context.mode.isControlDisabled;
                }
            };
            RichTextBoxControl.prototype.destroyCore = function () {
                console.log("RichTextBoxControl.destroyCore");
                if (this.editor) {
                    this.editor.destroy();
                    this.editor = null;
                }
            };
            RichTextBoxControl.prototype.disableControlInteraction = function () {
                console.log("RichTextBoxControl.disableControlInteraction");
                this.readonly = true;
                if (this.editor) {
                    this.editor.isReadOnly = true;
                }
            };
            RichTextBoxControl.prototype.enableControlInteraction = function () {
                console.log("RichTextBoxControl.enableControlInteraction");
                this.readonly = false;
                if (this.editor) {
                    this.editor.isReadOnly = false;
                }
            };
            RichTextBoxControl.prototype.updateView = function (context) {
                console.log("RichTextBoxControl.updateView");
                if (this.gettingOutput) {
                    this.gettingOutput = false;
                    return;
                }
                if (this.editor) {
                    var raw = context.parameters.value.raw || "";
                    if (!this.comparer.compareTo(raw, true)) {
                        this.editor.setData(raw);
                        this.dirty = false;
                    }
                    this.setControlState(context);
                }
            };
            RichTextBoxControl.prototype.destroy = function () {
                console.log("RichTextBoxControl.destroy");
                this.destroyCore();
            };
            RichTextBoxControl.prototype.getOutputs = function () {
                console.log("RichTextBoxControl.getOutputs");
                this.gettingOutput = true;
                if (this.editor) {
                    return { value: this.editor.getData() };
                }
                else {
                    return { value: this.context.parameters.value.raw || "" };
                }
            };
            RichTextBoxControl.prototype.init = function (context, notifyOutputChanged, state, container) {
                var _this = this;
                console.log("RichTextBoxControl.init");
                console.log("RichTextBoxControl.initCore");
                this.context = context;
                this.notifyOutputChanged = notifyOutputChanged;
                this.container = container || document.getElementById(context.client._customControlProperties.descriptor.DomId + "-FieldSectionItemContainer");
                var domId = context.client._customControlProperties.descriptor.DomId;
                var textareaId = "textarea-" + domId;
                var textarea = document.createElement("textarea");
                this.container.appendChild(textarea);
                var textareaControl = context.factory.createElement("TEXTAREA", {
                    id: textareaId,
                    key: textareaId,
                    tabIndex: -1,
                });
                context.utils.bindDOMElement(textareaControl, textarea);
                ClassicEditor.create(textarea, {
                    toolbar: ["undo", "redo", "bold", "italic", "blockquote", "imagetextalternative", "insertimage", "headings", "imagestylefull", "imagestyleside", "link", "numberedlist", "bulletedlist"]
                })
                    .then(function (editor) {
                    console.log("RichTextBoxControl.internal.editor.init");
                    _this.editor = editor;
                    var data = context.parameters.value.raw || "";
                    _this.editor.setData(data);
                    _this.comparer.update(data);
                    _this.dirty = false;
                    _this.editor.data.model.on("change", function (evt, prop) {
                        console.log("RichTextBoxControl.internal.editor.data.model.change");
                        return _this._onChange(evt, prop);
                    });
                    _this.editor.ui.focusTracker.on("change:isFocused", function (evt, prop, oldValue, newValue) {
                        if (!_this.comparer.compareTo(data, true)) {
                            _this.context.parameters.value.raw = data;
                            _this.notifyOutputChanged();
                        }
                    });
                    _this.editor.isReadOnly = _this.readonly;
                })
                    .catch(function (error) {
                    console.log("RichTextBoxControl.internal.error");
                    console.log(error);
                    _this.error = error;
                });
            };
            RichTextBoxControl.prototype.onPreNavigation = function () {
                console.log("RichTextBoxControl.onPreNavigation");
            };
            RichTextBoxControl.prototype.getMaxLength = function () {
                console.log("RichTextBoxControl.getMaxLength");
                return this.context.parameters.value.attributes.MaxLength;
            };
            RichTextBoxControl.prototype.getAttributeName = function () {
                console.log("RichTextBoxControl.getAttributeName");
                return this.context.parameters.value.attributes.LogicalName;
            };
            RichTextBoxControl.prototype._onChange = function (evt, propertyName, newValue, oldValue) {
                var _this = this;
                console.log("RichTextBoxControl._onChange");
                if (this.editor) {
                    var data = this.editor.getData();
                    if (data.length > this.getMaxLength()) {
                        return false;
                    }
                    if (!this.comparer.compareTo(data, true)) {
                        console.log("Comparer.compareTo found they do not match");
                        this.dirty = true;
                        this.context.parameters.value.raw = data;
                        setTimeout(function () {
                            _this.dirty = true;
                            _this.notifyOutputChanged();
                        }, 5000);
                    }
                }
                return true;
            };
            return RichTextBoxControl;
        }());
        Controls.RichTextBoxControl = RichTextBoxControl;
    })(Controls = FDBZAP.Controls || (FDBZAP.Controls = {}));
})(FDBZAP || (FDBZAP = {}));
//# sourceMappingURL=RichTextBoxControl.js.map