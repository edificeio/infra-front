import { $ } from "../../libs/jquery/jquery";
import { ui } from '../../ui';

export const table = { 
    name: 'table', 
    run: (instance) => {
        return {
            template: '' +
            '<popover mouse-event="click" on-close="resetScroll()">' +
            '<i popover-opener opening-event="click" tooltip="editor.option.table"></i>' +
            '<popover-content>' +
            '<div class="draw-table"></div>' +
            '</popover-content>' +
            '</popover>',
            link: function(scope, element, attributes){
                var nbRows = 12;
                var nbCells = 12;
                var drawer = element.find('.draw-table');
                for(var i = 0; i < nbRows; i++){
                    var line = $('<div class="row"></div>');
                    drawer.append(line);
                    for(var j = 0; j < nbCells; j++){
                        line.append('<div class="one cell"></div>');
                    }
                }

                scope.resetScroll = function(){
                    element.parents().css({ overflow: '' });
                    element.parents('editor-toolbar').each(function (index, item) {
                        $(item).css({ 'margin-top': '', 'min-height': '', height: '' })
                    });
                };

                ui.extendSelector.touchEvents('[contenteditable] td');

                element.find('i').on('click', function(){
                    if (element.find('popover-content').hasClass('hidden')) {
                        setTimeout(function () {
                            element.parents('editor-toolbar').each(function(index, item) {
                                $(item).css({
                                    'margin-top': '-' + item.scrollTop + 'px',
                                    'min-height': '0',
                                    'height': 'auto'
                                })
                            });
                            element.parents().css({
                                    overflow: 'visible'
                            });
                        }, 0);
                    }
                    else {
                        element.parents().css({ overflow: '' });
                        element.parents('editor-toolbar').each(function (index, item) {
                            $(item).css({ 'margin-top': '', 'min-height': '', height: '' })
                        });
                    }
                })

                drawer.find('.cell').on('mouseover', function(){
                    var line = $(this).parent();
                    for(var i = 0; i <= line.index(); i++){
                        var row = $(drawer.find('.row')[i]);
                        for(var j = 0; j <= $(this).index(); j++){
                            var cell = $(row.find('.cell')[j]);
                            cell.addClass('match');
                        }
                    }
                });

                drawer.find('.cell').on('mouseout', function(){
                    drawer.find('.cell').removeClass('match');
                });

                drawer.find('.cell').on('click', function(){
                    var table = document.createElement('table');
                    var line = $(this).parent();
                    for(var i = 0; i <= line.index(); i++){
                        var row = $('<tr></tr>');
                        $(table).append(row);
                        for(var j = 0; j <= $(this).index(); j++){
                            var cell = $('<td></td>');
                            cell.html('<br />')
                            row.append(cell);
                        }
                    }

                    instance.selection.replaceHTML('<div>' + table.outerHTML + '</div>');
                    instance.trigger('contentupdated');
                    
                });

                instance.bindContextualMenu(scope, 'td', [
                    {
                        label: 'editor.add.row',
                        action: function(e){
                            var newRow = $($(e.target).parent()[0].outerHTML);
                            newRow.find('td').html('<br />');
                            $(e.target).parent().after(newRow);
                        }

                    },
                    {
                        label: 'editor.add.column',
                        action: function(e){
                            var colIndex = $(e.target).index();
                            $(e.target).parents('table').find('tr').each(function(index, row){
                                $(row).children('td').eq(colIndex).after('<td><br /></td>')
                            });
                        }
                    },
                    {
                        label: 'editor.remove.row',
                        action: function(e){
                            $(e.target).parent().remove();
                        }
                    },
                    {
                        label: 'editor.remove.column',
                        action: function(e){
                            var colIndex = $(e.target).index();
                            $(e.target).parents('table').find('tr').each(function(index, row){
                                $(row).children('td').eq(colIndex).remove();
                            });
                        }
                    }
                ]);
            }
        }
    }
};