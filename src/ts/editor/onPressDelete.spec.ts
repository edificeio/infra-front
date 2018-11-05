import { $ } from "../libs";
import { findNodeAndOffsetOf } from "./onPressEnter.spec";
import { onPressDelete } from "./onPressDelete";

describe('onPressDelete', () => {
    let selection: Selection;
    beforeEach(() => {
        spyOn(document, "getSelection");
        selection = jasmine.createSpyObj("Selection", ["removeAllRanges", "addRange"]);
        (document.getSelection as jasmine.Spy).and.returnValue(selection);
    });

    it(`should addState <span>test</span>
            when editZone initially contains <span>test</span>`, () => {
        let {instance} = pressDelete('<span>test←</span>', selection);
        expect(instance.addState).toHaveBeenCalledWith('<span>test</span>');
    });
});

function pressDelete(content: string, selection: Selection): { event: any, range: Range, instance: any, editZone: any } {
    const event = jasmine.createSpyObj('KeyboardEvent', ['preventDefault']);
    const instance = jasmine.createSpyObj('Instance', ['addState']);
    let range = document.createRange();
    const editZoneElement = document.createElement('div');
    editZoneElement.innerHTML = content;

    // find and remove ← char, start the range at its position
    const {node, offset} = findNodeAndOffsetOf(editZoneElement, '←');
    node.nodeValue = node.nodeValue.replace('←', '');
    range.setStart(node, offset);

    const editZone = $(editZoneElement);
    onPressDelete(event, selection, instance, editZone);
    if ((selection.addRange as jasmine.Spy).calls.mostRecent()) {
        range = (selection.addRange as jasmine.Spy).calls.mostRecent().args[0];
    }

    return {event, range, instance, editZone};
}
