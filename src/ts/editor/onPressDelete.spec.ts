import { pressFactory, toBeEditedAs } from "./onPressEnter.spec";
import { onPressDelete } from "./onPressDelete";

// in the following spec:
//      ← represents where we are going to press delete
//      ‸ represents the expected start position of the range
describe('onPressDelete', () => {
    let selection: Selection;
    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
        spyOn(document, "getSelection");
        selection = jasmine.createSpyObj("Selection", ["getRangeAt", "removeAllRanges", "addRange"]);
        (document.getSelection as jasmine.Spy).and.returnValue(selection);
    });

    it(`should addState <span>test</span>
            when editZone initially contains <span>test</span>`, () => {
        let {instance} = pressDelete('<span>test←</span>', selection);
        expect(instance.addState).toHaveBeenCalledWith('<span>test</span>');
    });

    it(`should let the browser handles deletion
            when the deletion occurred in a non-empty line`, () => {
        let {editZone, range, event} = pressDelete('<div>test1</div><div>test2←</div>', selection);
        expect({editZone, range}).toBeEditedAs(`<div>test1</div><div>test2‸</div>`);
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it(`should removes zws character let the browser handles deletion
            when the deletion occurred in a non-empty line with a zws character`, () => {
        let {editZone, range, event} = pressDelete('<div>test1</div><div>\u200b←test2</div>', selection);
        expect({editZone, range}).toBeEditedAs(`<div>test1</div><div>‸test2</div>`);
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it(`should delete the empty div
            when the deletion occurred in an empty line`, () => {
        let {editZone, range, event} = pressDelete('<div>test</div><div>←</div>', selection);
        expect({editZone, range}).toBeEditedAs(`<div>test‸</div>`);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it(`should delete the empty line
            when the deletion occurred in a child of an empty line`, () => {
        let {editZone, range, event} = pressDelete('<div>test</div><div><span style="color: red">←</span></div>', selection);
        expect({editZone, range}).toBeEditedAs(`<div>test‸</div>`);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it(`should delete the empty line and move range in the previous text node
            when the deletion occurred in a child of an empty line`, () => {
        let {editZone, range, event} = pressDelete('test<div><span style="color: red">←</span></div>', selection);
        expect({editZone, range}).toBeEditedAs(`test‸`);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it(`should delete the empty div
            when the deletion occurred in a line with only zws characters`, () => {
        let {editZone, range, event} = pressDelete('<div>test</div><div>\u200b←\u200b</div>', selection);
        expect({editZone, range}).toBeEditedAs(`<div>test‸</div>`);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it(`should delete the previous div
            when the deletion occurred in a line with text and previous line is empty`, () => {
        let {editZone, range, event} = pressDelete('<div></div><div>\u200b←test</div>', selection);
        expect({editZone, range}).toBeEditedAs(`<div>‸test</div>`);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it(`should delete the current div
            when the deletion occurred in a line with a img and no text`, () => {
        let {editZone, range, event} = pressDelete(
            '<div>test</div><div><span class="delete-here"><span class="image-container"> <img/></span></span></div>',
            selection,
            '.delete-here'
        );
        expect({editZone, range}).toBeEditedAs(`<div>test‸</div>`);
        expect(event.preventDefault).toHaveBeenCalled();
    });
});

const pressDelete = pressFactory('←',
    (event: KeyboardEvent, selection: Selection, range: Range, instance: any, editZone: any) =>
        onPressDelete(event, selection, instance, editZone));

const customMatchers: jasmine.CustomMatcherFactories = {toBeEditedAs};
