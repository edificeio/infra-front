import { $ } from '../../libs/jquery/jquery';
import { model } from '../../modelDefinitions';
import { MediaLibrary } from '../../workspace';
import { idiom } from '../../idiom';

export const attachment = {
    name: 'attachment', 
    run: function (instance) {
        return {
            template: '<i ng-click="attachmentOption.display.pickFile = true" tooltip="editor.option.attachment"></i>' +
            '<div ng-if="attachmentOption.display.pickFile">' +
            '<lightbox show="attachmentOption.display.pickFile" on-close="cancel()">' +
            '<media-library ng-change="updateContent()" multiple="true" ng-model="attachmentOption.display.files" file-format="\'any\'" visibility="attachmentOption.visibility"></media-library>' +
            '</lightbox>' +
            '</div>',
            link: function (scope, element, attributes) {
                element.on('mousedown', 'a', function (e) {
                    e.stopPropagation();
                    $(e.target).parents('.download-attachments')[0].dispatchEvent(e);
                });

                scope.attachmentOption = {
                    display: { pickFile: false },
                    visibility: 'protected'
                }

                if (instance.visibility === 'public') {
                    scope.attachmentOption.visibility = 'public'
                }

                scope.cancel = function () {
                    scope.attachmentOption.display.pickFile = false;
                }

                instance.bindContextualMenu(scope, '.download-attachments', [
                    {
                        label: 'editor.edit.attachment',
                        action: function (e) {
                            if (!$(e.target).hasClass('download-attachments')) {
                                e.target = $(e.target).parents('.download-attachments')[0];
                            }
                            
                            instance.selection.selectNode(e.target);

                            var files = [];
                            $(e.target).find('a').each(function (index, item) {
                                var pathSplit = $(item).attr('href').split('/');
                                files.push(pathSplit[pathSplit.length - 1])
                            });
                            MediaLibrary.appDocuments.documents.deselectAll();
                            MediaLibrary.appDocuments.documents.all.map(function (doc) {
                                if (files.indexOf(doc._id) !== -1) {
                                    doc.selected = true;
                                }
                                return doc;
                            });
                            scope.attachmentOption.display.pickFile = true;
                        }
                    },
                    {
                        label: 'editor.remove.attachment',
                        action: function (e) {
                            if (!$(e.target).hasClass('download-attachments')) {
                                e.target = $(e.target).parents('.download-attachments')[0];
                            }
                            $(e.target).remove();
                            instance.trigger('contentupdated');
                        }
                    }
                ]);

                scope.display = {};
                scope.updateContent = function () {
                    var path = '/workspace/document/';
                    if (scope.attachmentOption.visibility === 'public') {
                        path = '/workspace/pub/document/';
                    }

                    var html = '<div class="download-attachments">' +
                        '<h2>' + idiom.translate('editor.attachment.title') + '</h2>' +
                        '<div class="attachments">';
                    scope.attachmentOption.display.files.forEach(function (file) {
                        html += '<a href="' + path + file._id + '"><div class="download"></div>' + file.name + '</a>';
                    });

                    html += '</div></div><div><br /><div><br /></div></div>';
                    instance.selection.replaceHTML(html);
                    instance.addState(instance.editZone.html());
                    scope.attachmentOption.display.pickFile = false;
                    scope.attachmentOption.display.files = [];
                    instance.focus();
                    MediaLibrary.appDocuments.documents.deselectAll();
                };
            }
        }
    }
};