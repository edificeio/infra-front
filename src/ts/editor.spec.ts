import { convertToEditorFormat, tryToConvertClipboardToEditorFormat } from './editor';

describe('convertToEditorFormat', () => {
    it('should remove any <style></style> nodes', () => {
        expect(convertToEditorFormat('<style>li {margin: 1px;}</style><ul><li>test1</li></ul><style>ul {color: red;}</style>'))
            .toBe('<ul><li>test1</li></ul>');
    });

    it('should remove any <meta> nodes', () => {
        expect(convertToEditorFormat('<meta http-equiv="content-type"><ul><li>test1</li></ul>'))
            .toBe('<ul><li>test1</li></ul>');
    });

    it('should remove any <title></title> nodes', () => {
        expect(convertToEditorFormat('<title>my title</title><ul><li>test1</li></ul>'))
            .toBe('<ul><li>test1</li></ul>');
    });

    it('should remove any <xml></xml> nodes', () => {
        expect(convertToEditorFormat('<xml></xml><ul><li>test1</li></ul>'))
            .toBe('<ul><li>test1</li></ul>');
    });

    it('should convert <b></b> nodes to <span></span> nodes', () => {
        expect(convertToEditorFormat('<ul><li>test1<b>test2</b>test3</li></ul>'))
            .toBe('<ul><li>test1<span style="font-weight: bold;">test2</span>test3</li></ul>');
    });

    it('should keep style attribute but remove not whitelisted properties from all styled nodes', () => {
        expect(convertToEditorFormat('<ul style="margin: 1px;"><li>test1</li></ul><div style="text-align: right;">test2</div>'))
            .toBe('<ul><li>test1</li></ul><div style="text-align: right;">test2</div>');
    });

    it('should remove unauthorized classes from nodes', () => {
        expect(convertToEditorFormat('<ul class="unauthorized"><li>test1</li></ul><div class="smiley">test2</div>'))
            .toBe('<ul><li>test1</li></ul><div class="smiley">test2</div>');
    });

    it('should remove class attribute from all classed nodes', () => {
        expect(convertToEditorFormat('<ul class="classed-ul"><li>test1</li></ul><p class="classed-p">test2</p>'))
            .toBe('<ul><li>test1</li></ul><div>test2</div>');
    });

    it('should transform <b> to <span style="font-weight: bold;"></span>', () => {
        expect(convertToEditorFormat('<b>test</b>'))
            .toBe('<span style="font-weight: bold;">test</span>');
    });

    it('should transform <i> to <span style="font-style: italic;"></span>', () => {
        expect(convertToEditorFormat('<i>test</i>'))
            .toBe('<span style="font-style: italic;">test</span>');
    });

    it('should transform <u> to <span style="text-decoration: underline;"></span>', () => {
        expect(convertToEditorFormat('<u>test</u>'))
            .toBe('<span style="text-decoration: underline;">test</span>');
    });

    it('should transform <sup> to <span style="vertical-align: super; font-size: 12px"></span>', () => {
        expect(convertToEditorFormat('<sup>test</sup>'))
            .toBe('<span style="font-size: 12px; vertical-align: super;">test</span>');
    });

    it('should transform <sub> to <span style="vertical-align: sub; font-size: 12px"></span>', () => {
        expect(convertToEditorFormat('<sub>test</sub>'))
            .toBe('<span style="font-size: 12px; vertical-align: sub;">test</span>');
    });

    it('should transform <strike> to <span></span>', () => {
        expect(convertToEditorFormat('<strike>test</strike>'))
            .toBe('<span>test</span>');
    });

    it('should transform <p align="right"> to <div style="text-align: right"></div>', () => {
        expect(convertToEditorFormat('<p align="right">test</p>'))
            .toBe('<div style="text-align: right;">test</div>');
    });

    it('should remove nested p in li', () => {
        expect(convertToEditorFormat('<ul><li><p>test</p></li></ul>'))
            .toBe('<ul><li>test</li></ul>')
    });

    describe('<font> tags', () => {
        it('when size attribute equals 1 should be converted in span with font-size 7' ,() => {
            expect(convertToEditorFormat('<font size="1">test</font>'))
                .toBe('<span style="font-size: 7pt;">test</span>')
        });
        it('when size attribute equals 2 should be converted in span with font-size 10' ,() => {
            expect(convertToEditorFormat('<font size="2">test</font>'))
                .toBe('<span style="font-size: 10pt;">test</span>')
        });
        it('when size attribute equals 3 should be converted in span with font-size 12' ,() => {
            expect(convertToEditorFormat('<font size="3">test</font>'))
                .toBe('<span style="font-size: 12pt;">test</span>')
        });
        it('when size attribute equals 4 should be converted in span with font-size 14' ,() => {
            expect(convertToEditorFormat('<font size="4">test</font>'))
                .toBe('<span style="font-size: 14pt;">test</span>')
        });
        it('when size attribute equals 5 should be converted in span with font-size 18' ,() => {
            expect(convertToEditorFormat('<font size="5">test</font>'))
                .toBe('<span style="font-size: 18pt;">test</span>')
        });
        it('when size attribute equals 6 should be converted in span with font-size 24' ,() => {
            expect(convertToEditorFormat('<font size="6">test</font>'))
                .toBe('<span style="font-size: 24pt;">test</span>')
        });
        it('when size attribute equals 7 should be converted in span with font-size 36' ,() => {
            expect(convertToEditorFormat('<font size="7">test</font>'))
                .toBe('<span style="font-size: 36pt;">test</span>')
        });
        it('when size attribute equals an unknown value should be converted in span with font-size 14px' ,() => {
            expect(convertToEditorFormat('<font size="-1">test</font>'))
                .toBe('<span style="font-size: 14pt;">test</span>')
        });
        it('when size attribute and font-size style, font-size should be used', () => {
            expect(convertToEditorFormat('<font size="6" style="font-size: 16px;">test</font>'))
                .toBe('<span style="font-size: 16px;">test</span>')
        });
        it('should tranform <font></font> nodes to <span></span>', () => {
            expect(convertToEditorFormat('<font color="red">test1</font><font face="Arial">test2</font><font size="6" style="font-size: 16px;"><font size="5">test3</font></font><font>test4</font>'))
                .toBe('<span style="color: red;">test1</span><span style="font-family: Arial;">test2</span><span style="font-size: 16px;"><span style="font-size: 18pt;">test3</span></span><span>test4</span>')
        });
    });

    it('should remove html comments', () => {
        expect(convertToEditorFormat('<div>test1</div><!-- test2 -->'))
            .toBe('<div>test1</div>');
    });
});

describe('tryToConvertClipboardToEditorFormat', () => {
    it(`should prevent paste event and call convertToEditorFormat function
        when the clipboard types contains 'text/html'`, () => {
        const event = generateClipboardEventMock(['text/plain', 'text/html'], 'whatever');
        const convertClipboardToEditorFormat = generateConvertClipboardToEditorFormatMock();
        tryToConvertClipboardToEditorFormat(event, convertClipboardToEditorFormat);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(convertClipboardToEditorFormat).toHaveBeenCalledWith('whatever');
    });

    it(`should not prevent paste event and not call convertToEditorFormat function
        when the clipboard types does not contain 'text/html'`, () => {
        const event = generateClipboardEventMock(['text/plain'], 'whatever');
        const convertClipboardToEditorFormat = generateConvertClipboardToEditorFormatMock();
        tryToConvertClipboardToEditorFormat(event, convertClipboardToEditorFormat);
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(convertClipboardToEditorFormat).not.toHaveBeenCalled();
    });
});

function generateConvertClipboardToEditorFormatMock() {
    return jasmine.createSpy('convertClipboardToEditorFormat');
}

function generateClipboardEventMock(types: string[], data: string): ClipboardEvent {
    const partialDataTransfer: Partial<DataTransfer> = {
        types,
        getData: () => data
    };
    const event: Partial<ClipboardEvent> = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: partialDataTransfer as DataTransfer
    };
    return event as ClipboardEvent;
}
