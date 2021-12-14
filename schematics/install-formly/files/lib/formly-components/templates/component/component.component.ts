import { Component, DoCheck, ViewChild, ViewContainerRef, ComponentFactoryResolver, Injector, SimpleChanges, ChangeDetectionStrategy, EventEmitter, OnDestroy } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'daenae-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ComponentComponent extends FieldType implements DoCheck, OnDestroy  {

    @ViewChild('container', { static: true, read: ViewContainerRef })
    public containerRef: ViewContainerRef;

    private previousComponentName: string;
    private previousComponentPropertiesHash: string;
    private listeners: any[] = [];

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        private injector: Injector
    ) {
        super();
    }

    ngDoCheck(): void {
        const currentComponentPropertiesHash = this.to.componentProperties ? JSON.stringify(this.to.componentProperties) : null;
        if (
            !this.to.component ||
            (this.to.component.name !== this.previousComponentName ||
            currentComponentPropertiesHash !== this.previousComponentPropertiesHash)
        ) {
            this.removeAllListeners();
            this.containerRef.clear();
            if (this.to.component) {
                this.initComponent();
                this.previousComponentName = this.to.component.name;
                this.previousComponentPropertiesHash = currentComponentPropertiesHash;
            }
        }
    }

    ngOnDestroy(): void {
        this.removeAllListeners();
    }

    private initComponent() {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.to.component);
        const inj: Injector = this.injector;
        const component = this.containerRef.createComponent<any>(componentFactory, undefined, inj);
        if (this.to.componentProperties) {
            const componentInstance = component.instance;
            Object.assign(componentInstance, this.to.componentProperties);
            if (componentInstance.ngOnChanges) {
                const changes = Object.keys(this.to.componentProperties).reduce((result, key) => {
                    result[key] = {
                        currentValue: this.to.componentProperties[key],
                        previousValue: undefined,
                        firstChange: true,
                        isFirstChange: () => true
                    };
                    return result;
                }, {} as SimpleChanges);
                componentInstance.ngOnChanges(changes);
            }
        }
        if (this.to.listeners) {
            const componentInstance = component.instance;
            this.listeners = Object.keys(this.to.listeners).reduce((acc, listener) => {
                if (listener in componentInstance && componentInstance[listener] instanceof EventEmitter) {
                    return [...acc, componentInstance[listener].subscribe((event) => {
                        this.to.listeners[listener](this.model, this.formState, this.field, event);
                    })];
                }
                return acc;
            }, []);
        }
    }

    private removeAllListeners() {
        this.listeners.forEach(listener => listener.unsubscribe());
        this.listeners = [];
    }

}
