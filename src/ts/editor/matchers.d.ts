declare module jasmine {
    interface Matchers<T> {
        toBeEditedAs(expected: Expected<string>, expectationFailOutput?: any): boolean;
    }
}
