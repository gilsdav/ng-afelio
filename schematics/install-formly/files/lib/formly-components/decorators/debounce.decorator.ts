
/**
 * Debounce function calls
 * @param delay delay in ms to debounce (default: `300`)
 */
 export function Debounce(delay: number = 300): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        let timeout = null;

        const original = descriptor.value;

        descriptor.value = function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => original.apply(this, args), delay);
        };

        return descriptor;
    };
}
