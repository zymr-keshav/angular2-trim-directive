import { Directive, ElementRef, HostListener, Inject, Input, Optional, Renderer2 } from "@angular/core";
import {
  COMPOSITION_BUFFER_MODE,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from "@angular/forms";

@Directive({
  selector: "input[trim], textarea[trim]",
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: InputTrimDirective, multi: true }]
})
export class InputTrimDirective implements ControlValueAccessor {
  // Get a value of the trim attribute if it was set.
  @Input() trim: string;

  @Input()
  set type(value: string) {
    this._type = value || "text";
  }

  /**
   * Keep the type of input element in a cache.
   *
   * @type {string}
   * @private
   */
  private _type: string = "text";

  /**
   * Keep the value of input element in a cache.
   *
   * @type {string}
   * @private
   */
  private _value: string;

  // Source services to modify elements.
  private _sourceRenderer: Renderer2;
  private _sourceElementRef: ElementRef;

  /**
   * Updates the value on the blur event.
   */
  @HostListener("blur", ["$event.type", "$event.target.value"])
  onBlur(event: string, value: string): void {
    this.updateValue(event, value.trim());
    this.onTouched();
  }

  /**
   * Updates the value on the input event.
   */
  @HostListener("input", ["$event.type", "$event.target.value"])
  onInput(event: string, value: string): void {
    this.updateValue(event, value);
  }

  onChange = (_: any) => {};

  onTouched = () => {};

  constructor(
    @Inject(Renderer2) renderer: Renderer2,
    @Inject(ElementRef) elementRef: ElementRef,
    @Optional() @Inject(COMPOSITION_BUFFER_MODE) compositionMode: boolean
  ) {
    this._sourceRenderer = renderer;
    this._sourceElementRef = elementRef;
  }

  registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }

  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  /**
   * Writes a new value to the element based on the type of input element.
   *
   * @param {any} value - new value
   */
  public writeValue(value: any): void {
    //
    // The Template Driven Form doesn't automatically convert undefined values to null. We will do,
    // keeping an empty string as string because the condition `'' || null` returns null what
    // could change the initial state of a model.
    // The Reactive Form does it automatically during initialization.
    //
    // ISSUE: https://github.com/anein/angular2-trim-directive/issues/18
    //
    this._value = value === "" ? "" : value || null;

    this._sourceRenderer.setProperty(this._sourceElementRef.nativeElement, "value", this._value);

    // a dirty trick (or magic) goes here:
    // it updates the element value if `setProperty` doesn't set a new value for some reason.
    //
    // ISSUE: https://github.com/anein/angular2-trim-directive/issues/9
    //
    if (this._type !== "text") {
      this._sourceRenderer.setAttribute(this._sourceElementRef.nativeElement, "value", this._value);
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this._sourceRenderer.setProperty(this._sourceElementRef.nativeElement, 'disabled', isDisabled);
  }

  /**
   * Trims an input value, and sets it to the model and element.
   *
   * @param {string} value - input value
   * @param {string} event - input event
   * refector condition when there is single character and it does not update the model value
   */
  private updateValue(event: string, value: string): void {
        const currentValue = this.trim !== '' && event !== this.trim ? value : value.trim();
        const previousValue = this._value;
        let trimmedPreviousValue = '';
        if (Boolean(previousValue)) {
            trimmedPreviousValue = previousValue.trim();
        }

        this.writeValue(currentValue);
        const trimmedValue = this._value.trim();
        if (trimmedValue !== previousValue && (trimmedValue !== '' || trimmedPreviousValue !== '')) {
            this.onChange(this._value);
        }
    }
}
