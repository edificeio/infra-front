import { $ } from '../../libs/jquery/jquery';
import { _ } from '../../libs/underscore/underscore';

export const font = {
    name: 'font', 
    run: function(instance){
        return {
            mobile: false,
            template:
            '<select-list display="font" display-as="fontFamily" placeholder="editor.font.placeholder" tooltip="editor.option.font">' +
            '<opt ng-repeat="font in fonts" ng-click="setFontFamily(font)" ' +
            'value="font" ng-style="{ \'font-family\': \'[[font.fontFamily]]\' }">[[font.fontFamily]]</opt>' +
            '</select-list>',
            link: function(scope, element, attributes){

                function loadImportedFonts(){
                    return _.map(
                        _.flatten(
                            _.map(
                                document.styleSheets,
                                function(stylesheet){
                                    return _.filter(
                                        stylesheet.cssRules,
                                        function(cssRule){
                                            return cssRule instanceof CSSFontFaceRule &&
                                                cssRule.style.cssText.toLowerCase().indexOf('fontello') === -1 &&
                                                cssRule.style.cssText.toLowerCase().indexOf('glyphicon') === -1 &&
                                                cssRule.style.cssText.toLowerCase().indexOf('fontawesome') === -1 &&
                                                cssRule.style.cssText.toLowerCase().indexOf('mathjax') === -1;
                                        }
                                    )
                                }
                            )
                        ),
                        function(fontFace){
                            var fontName = fontFace.style.cssText.split('font-family:')[1].split(';')[0].trim();
                            if(fontName.startsWith('"')){
                                fontName = fontName.substring(1);
                            }
                            if(fontName.endsWith('"')){
                                fontName = fontName.substring(0, fontName.length - 1);
                            }
                            return {
                                fontFamily: fontName
                            }
                        }
                    );
                }

                scope.fonts = [];
                scope.font = '';

                setTimeout(function() {
                    var importedFonts = loadImportedFonts();
                    importedFonts = _.uniq(importedFonts, function(item, key, a) { 
                        return item.fontFamily;
                    });
                    importedFonts = _.reject(importedFonts, function(font){ 
                        return font.fontFamily.trim() === 'generic-icons' || font.fontFamily.trim() === 'editor';
                    });
                    scope.fonts = scope.fonts.concat(importedFonts);
                    scope.font = _.find(scope.fonts, function (font) {
                        return $('p').css('font-family').toLowerCase().indexOf(font.fontFamily.toLowerCase()) !== -1
                    });
                }, 1000);

                scope.setFontFamily = function (font) {
                    scope.font = font;
                    instance.selection.css({ 'font-family': '"' + font.fontFamily + '"' });
                };

                instance.on('selectionchange', function(e){
                    scope.font = _.find(scope.fonts, function (font) {
                        return font.fontFamily.trim() === instance.selection.css('font-family');
                    });
                });
            }
        };
    }
};