import { idiom } from '../../idiom';
import { skin } from '../../skin';
import { _ } from '../../libs/underscore/underscore';

export const templates = {
    name: 'templates', 
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.templates"></i>' +
            '<lightbox show="display.pickTemplate" on-close="display.pickTemplate = false;">' +
            '<h2><i18n>editor.option.templates</i18n></h2>' +
            '<ul class="thought-out-actions">' +
            '<li ng-repeat="template in templates" ng-click="applyTemplate(template)">' +
                '<img ng-src="[[template.image]]" class="cell" />' +
                '<div class="cell vertical-spacing horizontal-spacing" translate content="[[template.title]]"></div>' +
            '</li>' +
            '</ul>' +
            '</lightbox>',
            link: function (scope, element, attributes) {
                var skinPath = skin.basePath + '../entcore-css-lib/editor-resources/img/';
                scope.templates = [
                    {
                        title: 'editor.templates.emptypage.title',
                        image: skinPath + 'templates-preview-emptypage.svg',
                        html: '<div class="twelve cell column"><article></article></div>'
                    },
                    {
                        title: 'editor.templates.twocols.title',
                        image: skinPath + 'templates-preview-twocols.svg',
                        html:
                        '<div class="row">' +
                        '<div class="six cell column">' +
                            '<article>' +
                                '<h2>' +
                                idiom.translate('editor.templates.coltitle') +
                                '</h2>' +
                                '<p>' +
                                idiom.translate('editor.templates.colfiller') +
                                '</p>' +
                            '</article>' +
                        '</div>' +
                        '<div class="six cell column">' +
                            '<article>' +
                                '<h2>' +
                                idiom.translate('editor.templates.coltitle') +
                                '</h2>' +
                                '<p>' +
                                idiom.translate('editor.templates.colfiller') +
                                '</p>' +
                            '</article>' +
                        '</div>' +
                        '</div>'
                    },
                    {
                        title: 'editor.templates.threecols.title',
                        image: skinPath + 'templates-preview-threecols.svg',
                        html:
                        '<div class="row">' +
                        '<div class="four cell column">' +
                            '<article>' +
                                '<h2>' +
                                idiom.translate('editor.templates.coltitle') +
                                '</h2>' +
                                '<p>' +
                                idiom.translate('editor.templates.colfiller') +
                                '</p>' +
                            '</article>' +
                        '</div>' +
                        '<div class="four cell column">' +
                            '<article>' +
                                '<h2>' +
                                idiom.translate('editor.templates.coltitle') +
                                '</h2>' +
                                '<p>' +
                                idiom.translate('editor.templates.colfiller') +
                                '</p>' +
                            '</article>' +
                        '</div>' +
                        '<div class="four cell column">' +
                            '<article>' +
                                '<h2>' +
                                idiom.translate('editor.templates.coltitle') +
                                '</h2>' +
                                '<p>' +
                                idiom.translate('editor.templates.colfiller') +
                                '</p>' +
                            '</article>' +
                        '</div>' +
                        '</div>'
                    },
                    {
                        title: 'editor.templates.illustration.title',
                        image: skinPath + 'templates-preview-illustration.svg',
                        html:
                        '<div class="row">' +
                            '<div class="three cell image-template column">' +
                                '<article>' +
                                    '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" />' +
                                '</article>' +

                            '</div>' +
                            '<div class="nine cell column">' +
                                '<article>' +
                                    '<h2>' +
                                        idiom.translate('editor.templates.illustration.titlefiller') +
                                    '</h2>' +
                                    '<p>' +
                                    idiom.translate('editor.templates.illustration.textfiller') +
                                    '</p>' +
                                '</article>' +
                            '</div>' +
                        '</div>'
                    },
                    {
                        title: 'editor.templates.dominos.title',
                        image: skinPath + 'templates-preview-dominos.svg',
                        html:
                        '<div class="dominos">' +
                            '<div class="item">' +
                                '<section class="domino pink">' +
                                '<div class="top image-template">' +
                                    '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" class="fixed twelve cell" />' +
                                '</div>' +
                                '<div class="bottom">' +
                                    '<div class="content">' +
                                        idiom.translate('editor.templates.dominos.textfiller') +
                                    '</div>' +
                                '</div>' +
                                '</section>' +
                            '</div>' +
                            '<div class="item">' +
                                '<section class="domino blue">' +
                                    '<div class="top image-template">' +
                                        '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" class="fixed twelve cell" />' +
                                    '</div>' +
                                    '<div class="bottom">' +
                                        '<div class="content">' +
                                            idiom.translate('editor.templates.dominos.textfiller') +
                                        '</div>' +
                                    '</div>' +
                                '</section>' +
                            '</div>' +
                            '<div class="item">' +
                                '<section class="domino orange">' +
                                    '<div class="top image-template">' +
                                        '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" class="fixed twelve cell" />' +
                                    '</div>' +
                                        '<div class="bottom">' +
                                        '<div class="content">' +
                                            idiom.translate('editor.templates.dominos.textfiller') +
                                        '</div>' +
                                    '</div>' +
                                '</section>' +
                            '</div>' +
                            '<div class="item">' +
                                '<section class="domino purple">' +
                                    '<div class="top image-template">' +
                                        '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" class="fixed twelve cell" />' +
                                    '</div>' +
                                    '<div class="bottom">' +
                                        '<div class="content">' +
                                            idiom.translate('editor.templates.dominos.textfiller') +
                                        '</div>' +
                                    '</div>' +
                                '</section>' +
                            '</div>' +
                            '<div class="item">' +
                                '<section class="domino green">' +
                                    '<div class="top image-template">' +
                                        '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" class="fixed twelve cell" />' +
                                    '</div>' +
                                    '<div class="bottom">' +
                                        '<div class="content">' +
                                            idiom.translate('editor.templates.dominos.textfiller') +
                                        '</div>' +
                                    '</div>' +
                                '</section>' +
                            '</div>' +
                            '<div class="item">' +
                                '<section class="domino white">' +
                                    '<div class="top image-template">' +
                                        '<img src="' + skinPath + 'image-default.svg" style="cursor: pointer" class="fixed twelve cell" />' +
                                    '</div>' +
                                        '<div class="bottom">' +
                                        '<div class="content">' +
                                            idiom.translate('editor.templates.dominos.textfiller') +
                                        '</div>' +
                                    '</div>' +
                                '</section>' +
                            '</div>' +
                        '</div>'
                    }
                ];
                scope.display = {};
                scope.applyTemplate = function(template){
                    scope.display.pickTemplate = false;
                    instance.selection.replaceHTML(_.findWhere(scope.templates, { title: template.title}).html);
                };

                element.children('i').on('click', function(){
                    scope.display.pickTemplate = true;
                    scope.$apply('display');
                });
            }
        }
    }
};