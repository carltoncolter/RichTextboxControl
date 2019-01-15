/**
 * RichTextBoxControl using CKEditor5
 */

declare var ClassicEditor: any;

namespace FDBZAP {
    export namespace Controls {
        export class TextComparer {
            private value: string;

            public update(data: string) {
                this.value = data.toString();
            }

            public compareTo(data: string, saveIfDifferent?: boolean): boolean {
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
            }

            public hashCode(data: string): number {
                let hash: number = 0;
                if (!data) {
                    return hash;
                }
                for (let i = 0; i < data.length; i++) {
                    const chr = data.charCodeAt(i);
                    // tslint:disable-next-line:no-bitwise
                    hash = ((hash << 5) - hash) + chr;
                    // tslint:disable-next-line:no-bitwise
                    hash |= 0;
                }

                return hash;
            }
        }

        export class RichTextBoxControl {
            public get isCurrentlyBeingEdited() {
                return (this.editor && this.editor.data && this.editor.ui.focusTracker.isFocused);
            }

            private context: any;
            private dirty: boolean;
            private comparer: TextComparer;
            private container: HTMLElement | null;
            private shouldNotifyOutputChanged: boolean;
            private editor: any;
            private error: any = null;
            private readonly: boolean;
            private gettingOutput: boolean;
            private destroying: boolean;

            /**
             * Notify framework value was changed
             */
            private notifyOutputChanged: () => void;

            constructor() {
                console.log("RichTextBoxControl.constructor");
                this.comparer = new TextComparer();
                this.gettingOutput = false;
            }

            public isDirty() {
                console.log("RichTextBoxControl.isDirty");
                return this.isCurrentlyBeingEdited || this._isDirtyValue();
            }

            public renderReadMode() {
                console.log("RichTextBoxControl.renderReadMode");
                this._disableControlInteraction();
            }

            public renderEditMode() {
                console.log("RichTextBoxControl.renderEditMode");
            }

            public isError() {
                console.log("RichTextBoxControl.isError");
                return (this.error !== null);
            }

            /********** Identified as most likely required methods *******/
            public setControlState(context: any) {
                console.log("RichTextBoxControl.setControlState");
                this.shouldNotifyOutputChanged = !(context.mode.isControlDisabled || !context.parameters.value.security.editable || context.page && context.page.isPageReadOnly);
                if (!this.shouldNotifyOutputChanged) {
                    this._disableControlInteraction();
                } else {
                    this._enableControlInteraction();
                }
            }

            public isControlDisabled() {
                console.log("RichTextBoxControl.isControlDisabled");
                if (this.editor) {
                    return this.editor.isReadOnly;
                } else {
                    return this.context.mode.isControlDisabled;
                }
            }
            
            public updateView(context: any) {
                console.log("RichTextBoxControl.updateView");
                if (this.gettingOutput) {
                    // this stops needlessly updating the control....
                    this.gettingOutput = false;
                    return;
                }
                if (this.editor) {
                    const raw = context.parameters.value.raw || "";
                    if (!this.comparer.compareTo(raw, true)) {
                        this.editor.setData(raw);
                        this.dirty = false;
                    }
                    this.setControlState(context);
                }
            }

            public destroy() {
                console.log("RichTextBoxControl.destroy");
                this._destroy(!this.destroying);
            }

            public getOutputs() {
                console.log("RichTextBoxControl.getOutputs");
                this.gettingOutput = true;
                if (this.editor) {
                    return { value: this.editor.getData() };
                } else {
                    return { value: this.context.parameters.value.raw || "" };
                }
            }

            public init(context: any, notifyOutputChanged: () => void, state?: any, container?: HTMLDivElement) {
                console.log("RichTextBoxControl.init");
                this.context = context;
                this.notifyOutputChanged = notifyOutputChanged;
                //  debugger;
                this.container = container || document.getElementById(context.client._customControlProperties.descriptor.DomId + "-FieldSectionItemContainer");

                const domId = context.client._customControlProperties.descriptor.DomId;
                const textareaId = `textarea-${domId}`;
                const textarea = document.createElement("textarea");
                this.container!.appendChild(textarea);

                const textareaControl = context.factory.createElement("TEXTAREA", {
                    id: textareaId,
                    key: textareaId,
                    tabIndex: -1,
                });

                context.utils.bindDOMElement(textareaControl, textarea);

                ClassicEditor.create(textarea)
                    .then((editor: any) => {
                        console.log("RichTextBoxControl.internal.editor.init");
                        this.editor = editor;
                        const data = context.parameters.value.raw || "";
                        this.editor.setData(data);
                        this.comparer.update(data);
                        this.dirty = false;
                        this.editor.data.model.on("change", (evt: any, prop: any) => {
                            console.log("RichTextBoxControl.internal.editor.data.model.change");
                            return this._onChange(evt, prop);
                        });
                        this.editor.ui.focusTracker.on("change:isFocused", (evt: any, prop: string, oldValue: boolean, newValue: boolean) => {
                            // force notification if different on lost focus isntead of waiting for interval
                            if (!this.comparer.compareTo(data, true)) {
                                this.context.parameters.value.raw = data;
                                this.notifyOutputChanged();
                            }

                        });
                        this.editor.isReadOnly = this.readonly;
                    })
                    .catch((error: any) => {
                        console.log("RichTextBoxControl.internal.error");
                        console.log(error);
                        this.error = error;
                    });
            }

            public onPreNavigation() {
                console.log("RichTextBoxControl.onPreNavigation");
            }
            
            private _destroy(destroy: boolean) {
                console.log("RichTextBoxControl._destory");
                if (!destroy) {
                    return;
                }
                this.destroying = true;
                if (this.editor) {
                    this.editor.destroy();
                    this.editor = null;
                }
            }

            private _disableControlInteraction() {
                console.log("RichTextBoxControl._disableControlInteraction");
                this.readonly = true;
                if (this.editor) {
                    this.editor.isReadOnly = true;
                }
            }

            private _enableControlInteraction() {
                console.log("RichTextBoxControl._enableControlInteraction");
                this.readonly = false;
                if (this.editor) {
                    this.editor.isReadOnly = false;
                }
            }

            private _getMaxLength() {
                console.log("RichTextBoxControl._getMaxLength");
                return this.context.parameters.value.attributes.MaxLength;
            }

            private _getAttributeName() {
                console.log("RichTextBoxControl._getAttributeName");
                return this.context.parameters.value.attributes.LogicalName;
            }

            private _isDirtyValue() {
                console.log("RichTextBoxControl._isDirtyValue");
                if (this.editor) {
                    return this.dirty || this.comparer.compareTo(this.context.parameters.value.raw);
                }
                return false; // not finished loading...
            }

            private _onChange(evt?: any, propertyName?: string, newValue?: any, oldValue?: any) {
                console.log("RichTextBoxControl._onChange");

                if (this.editor) {
                    const data = this.editor.getData();
                    if (data.length > this._getMaxLength() /* || data.length > 1048576 -D365 Max size */) {
                        return false;
                    }
                    if (!this.comparer.compareTo(data, true)) {
                        console.log("Comparer.compareTo found they do not match");
                        this.dirty = true;
                        this.context.parameters.value.raw = data;
                        setTimeout(() => {
                            this.dirty = true;
                            this.notifyOutputChanged();
                        }, 5000); // only send notifications to update at 5 second intervals... or lost focus.

                    }
                }
                return true;
            }
        }
    }
}
