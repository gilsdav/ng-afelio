import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';

@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[clickOutside]'
})
export class ClickOutsideDirective implements OnDestroy {

    @Output() clickOutside = new EventEmitter<void>();

    constructor(private elementRef: ElementRef, @Inject(DOCUMENT) private document: Document) {
        this.document.addEventListener('click', this.onClick, true);
    }

    ngOnDestroy(): void {
        this.document.removeEventListener('click', this.onClick, true);
    }

    public onClick = (event: MouseEvent) => {
        const clickedInside = this.elementRef.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.clickOutside.emit();
        }
    }
}
