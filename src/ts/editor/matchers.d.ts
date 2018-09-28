declare module jasmine {
    interface Matchers<T> {
        toBeStyledAs(expected: Expected<string>, expectationFailOutput?: any): boolean;
    }
}
