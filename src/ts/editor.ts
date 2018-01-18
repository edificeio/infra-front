import { $ } from './libs/jquery/jquery';
import { Behaviours } from './behaviours';
import { idiom as lang } from './idiom';
import { MediaLibrary, Document } from './workspace';
import { ui } from './ui';
import { model } from './modelDefinitions';
import { http } from './http';
import { _ } from './libs/underscore/underscore';
import { appPrefix } from './globals';
import { notify } from './notify';
import { skin } from './skin';
import { Selection, textNodes, formatNodes } from './editor/selection';
import * as editorOptions from './editor/options';
import { workflow } from './directives/workflow';
import { onPressEnter } from './editor/onPressEnter';
import { onDropFromDesktop } from './editor/onDropFromDesktop';

declare let Prism: any;

function rgb(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
var rgba = rgb;
var transparent = 'rgba(255, 255, 255, 0)';

export let RTE = {
    baseToolbarConf: {} as any,
    Instance: function(data){
        var that = this;
        this.states = [];
        this.stateIndex = 0;
        this.editZone = this.element.find('[contenteditable]');
        this.selection = new RTE.Selection({
            instance: this,
            editZone: this.editZone
        });

        this.focus = function(){
            var sel = window.getSelection();
            sel.removeAllRanges();
            if (this.selection.range) {
                sel.addRange(this.selection.range);
            } else {
                this.editZone.focus();
            }
        };

        this.execCommand = function(commandId, useUi, value){
            this.addState(this.editZone.html());
            document.execCommand(commandId, useUi, value);

            this.trigger('contentupdated');
        };

        var mousePosition = {} as any;
        this.editZone.on('mousemove', function(e){
            mousePosition = {
                left: e.pageX,
                top: e.pageY
            }
        });

        var contextualMenu = this.element.children('contextual-menu');
        contextualMenu.on('contextmenu', function(e){
            e.preventDefault();
            return false;
        });
        this.bindContextualMenu = function(scope, selector, items){
            this.editZone.on('contextmenu longclick', selector, function(e, position){
                e.preventDefault();

                if (position) {
                    mousePosition = position;
                }

                contextualMenu.children('ul').html('');
                items.forEach(function (item) {
                    var node = $('<li></li>');
                    node.on('click', function (event) {
                        item.action(e);
                        scope.$apply();
                    });
                    node.html(lang.translate(item.label));
                    contextualMenu.children('ul').append(node)
                });

                contextualMenu.addClass('show');
                e.preventDefault();
                contextualMenu.offset({
                    top: mousePosition.top,
                    left: mousePosition.left
                });

                contextualMenu.children('li').on('click', function () {
                    contextualMenu.removeClass('show');
                });

                return false;
            });
        };

        $('body').on('click', function(e){
            contextualMenu.removeClass('show');
        });

        $('body').on('touchstart', this.editZone, function (e) {
            $('body').on('touchend touchleave', this.editZone, function(f){
                if($(e.target).parents('lightbox').parents('editor').length > 0 || !that.selection.changed()){
                    return;
                }
                that.trigger('selectionchange', {
                    selection: that.selection
                });
            });
        });

        $('body').on('mouseup', function(e){
            if($(e.target).parents('lightbox').parents('editor').length > 0 || !that.selection.changed()){
                return;
            }
            that.trigger('selectionchange', {
                selection: that.selection
            });
        });

        data.element.on('keyup', function(e){
            that.trigger('contentupdated');
            if(!that.selection.changed()){
                return;
            }
            that.trigger('selectionchange', {
                selection: that.selection
            });
            that.scope.$apply();
        });

        this.applyState = function () {
            this.editZone.html(
                this.compile(this.states[this.stateIndex - 1].html)(this.scope)
            );
            
            if (this.states[this.stateIndex - 1].range) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(this.states[this.stateIndex - 1].range);
            }
        };

        this.undo = function(){
            if(this.stateIndex === 0){
                return;
            }
            this.stateIndex --;
            this.applyState();
        };

        this.redo = function(){
            if(this.stateIndex === this.states.length){
                return;
            }
            this.stateIndex ++;
            this.applyState();
        };

        this.addState = function(state){
            if (this.states[this.stateIndex - 1] && state === this.states[this.stateIndex - 1].html) {
                return;
            }
            if(this.stateIndex === this.states.length){
                this.states.push({ html: state, range: this.selection.range});
                this.stateIndex ++;
            }
            else{
                this.states = this.states.slice(0, this.stateIndex);
                this.addState({ html: state, range: this.selection.range });
            }
        };

        this.toolbar = new RTE.Toolbar(this);
    },
    Selection: Selection,
    Toolbar: function(instance){
        instance.toolbarConfiguration.options.forEach(function(option){
            if(option.mobile === false && $(window).width() <= ui.breakpoints.tablette){
                return;
            }
            var optionElement = $('<div></div>');
            optionElement.addClass('option');
            optionElement.addClass(option.name.replace(/([A-Z])/g, "-$1").toLowerCase());
            instance.element.find('editor-toolbar').append(optionElement);
            var optionScope = instance.scope.$new();

            var optionResult = option.run(instance);
            if (optionResult.template) {
                optionElement.html(instance.compile(optionResult.template)(optionScope));
                optionResult.link(optionScope, optionElement, instance.attributes);
            }
            if (optionResult.templateUrl) {
                http().get(optionResult.templateUrl).done(function (content) {
                    optionElement.html(instance.compile(content)(optionScope));
                    optionResult.link(optionScope, optionElement, instance.attributes);
                }.bind(this));
            }
        });
    },
    ToolbarConfiguration: function(){
        this.collection(RTE.Option);
        this.option = function(name, fn){
            this.options.push({
                name: name,
                run: fn
            });
        };
        for(let prop in editorOptions){
            this.options.push(editorOptions[prop]);
        }
    },
    Option: function(){

    },
    setModel: function(){
        model.makeModels(RTE);
        RTE.baseToolbarConf = new RTE.ToolbarConfiguration();
    },
    addDirectives: function(module){
        this.setModel();

        //Editor
        module.directive('editor', ['$parse', '$compile', function($parse, $compile) {
            return {
                restrict: 'E',
                template: '' +
                    '<button type="button" class="editor-toolbar-opener"></button>' +
                    '<button type="button" class="close-focus">OK</button>' +
                    '<editor-toolbar></editor-toolbar>' +
                    '<contextual-menu><ul></ul></contextual-menu>' +
                    '<popover>' +
                    '<i class="tools" popover-opener opening-event="click"></i>' +
                    '<popover-content>' +
                    '<ul>' +
                    '<li><i18n>editor.mode.wysiwyg</i18n></li>' +
                    '<li><i18n>editor.mode.html</i18n></li>' +
                    '<li><i18n>editor.mode.mixed</i18n></li>' +
                    '</ul>' +
                    '</popover-content>' +
                    '</popover>' +
                    '<div><div contenteditable="true"></div></div>' +
                    '<textarea></textarea>' +
                    '<code class="language-html"></code>',
                link: function (scope, element, attributes) {
                    if (navigator.userAgent.indexOf('Trident') !== -1 || navigator.userAgent.indexOf('Edge') !== -1) {
                        element.find('code').hide();
                    }
                    if($('.prism-css').length === 0){
                        $('body').append(
                            $('<link />')
                                .attr('rel', 'stylesheet')
                                .attr('type', 'text/css')
                                .attr('class', 'prism-css')
                                .attr('href', '/infra/public/js/prism/prism.css')
                        );

                        http().get('/infra/public/js/prism/prism.js')
                    }

                    element.find('.close-focus').on('click', function(){
                        element.removeClass('focus');
                        element.parent().data('lock', false);
                        element.parents('grid-cell').data('lock', false);
                        element.trigger('editor-blur');
                        $('body').css({ overflow: 'auto' });
                    });

                    element.find('.editor-toolbar-opener').on('click', function(e){
                        if(!$(this).hasClass('active')){
                            $(this).addClass('active');
                            element.find('editor-toolbar').addClass('opened');
                        }
                        else{
                            $(this).removeClass('active')
                            element.find('editor-toolbar').removeClass('opened');
                        }
                    });
                    
                    element.find('.editor-toolbar-opener').on('touchstart', function(e){
                        e.preventDefault();
                        if(!$(this).hasClass('active')){
                            $(this).addClass('active');
                            element.find('editor-toolbar').addClass('opened');
                        }
                        else{
                            $(this).removeClass('active')
                            element.find('editor-toolbar').removeClass('opened');
                        }
                        setTimeout(function(){
                            var sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(editorInstance.selection.range);
                        }, 100);
                    });
                    
                    document.execCommand("enableObjectResizing", false, false);
                    document.execCommand("enableInlineTableEditing", null, false);
                    document.execCommand("insertBrOnReturn", false, true);

                    element.addClass('edit');
                    var editZone = element.find('[contenteditable=true]');
                    var htmlZone = element.children('textarea');
                    var highlightZone = element.children('code');
                    var toolbarElement = element.children('editor-toolbar');
                    document.execCommand("styleWithCSS", false, true);

                    if(attributes.inline !== undefined){
                        element.children('editor-toolbar').addClass('inline');
                    }

                    var toolbarConf = RTE.baseToolbarConf;
                    if(attributes.toolbarConf){
                        toolbarConf = scope.$eval(attributes.toolbarConf);
                    }
                    
                    var editorInstance;
                    var instance = $parse(attributes.instance);
                    if(!instance(scope)){
                        editorInstance = new RTE.Instance({
                            toolbarConfiguration: toolbarConf,
                            element: element,
                            scope: scope,
                            compile: $compile,
                            editZone: editZone,
                            visibility: scope.$parent.$eval(element.attr('visibility'))
                        });
                    }
                    else{
                        editorInstance = instance;
                    }

                    editorInstance.addState('');
                    var ngModel = $parse(attributes.ngModel);
                    if(!ngModel(scope)){
                        ngModel.assign(scope, '');
                    }

                    scope.$watch(
                        function () {
                            return ngModel(scope);
                        },
                        function (newValue) {
                            $(newValue).find('.math-tex').each(function (index, item) {
                                var mathItem = $('<mathjax></mathjax>');
                                mathItem.attr('formula', item.textContent.replace('\\(', '$$$$').replace('\\)', '$$$$').replace('x = ', ''));
                                $(item).removeClass('math-tex');
                                $(item).text('');
                                $(item).append(mathItem);
                            });

                            if (
                                newValue !== editZone.html() &&
                                !editZone.is(':focus') &&
                                $('editor-toolbar').find(':focus').length === 0
                            ) {
                                editZone.html($compile(ngModel(scope))(scope));
                                editorInstance.trigger('model-updated');
                                editZone.find('i18n').each(function(index, item){
                                    var parent = $(item).parent()[0];
                                    var newEl = $('<span></span>').html($(item).html());
                                    parent.insertBefore(newEl[0], item);
                                    item.remove();
                                });
                            }
                            if(newValue !== htmlZone.val() && !htmlZone.is(':focus')){
                                if(window.html_beautify){
                                    htmlZone.val(window.html_beautify(newValue));
                                    highlightZone.text(window.html_beautify(newValue));
                                    Prism.highlightAll();
                                }
                                //beautifier is not loaded on mobile
                                else{
                                    htmlZone.val(newValue);
                                }
                            }
                        }
                    );

                    var previousScroll = 0;
                    var placeEditorToolbar = 0;
                    var sticky = function() {
                        if(element.parents('.editor-media').length > 0 || element.parents('body').length === 0){
                            return;
                        }
                        
                        if(toolbarElement.css('position') !== 'absolute'){
                            toolbarElement.css({ 'position': 'absolute', 'top': '0px' });
                            element.css({ 'padding-top': toolbarElement.height() + 1 + 'px' });
                        }
                        var topDistance = element.offset().top - $('.height-marker').height();
                        if (topDistance < (window.scrollY || window.pageYOffset)) {
                            topDistance = (window.scrollY || window.pageYOffset);
                        }
                        if (topDistance > editZone.offset().top + editZone.height() - toolbarElement.height()) {
                            topDistance = editZone.offset().top + editZone.height() - toolbarElement.height();
                        }
                        if (attributes.inline !== undefined) {
                            toolbarElement.offset({
                                top: topDistance + $('.height-marker').height()
                            });
                            element.children('popover').offset({
                                top: topDistance + $('.height-marker').height() + 10 - parseInt(element.css('margin-top'))
                            });
                        }
                        else {
                            toolbarElement.offset({
                                top: topDistance + $('.height-marker').height()
                            });
                            element.children('popover').offset({
                                top: topDistance + $('.height-marker').height() + 10
                            });
                        }
                        
                        setTimeout(function () {
                            highlightZone.offset({ top: htmlZone.offset().top });
                        }, 100);

                        previousScroll = (window.scrollY || window.pageYOffset);

                        placeEditorToolbar = requestAnimationFrame(sticky);
                    }

                    if(ui.breakpoints.tablette <= $(window).width()){
                        placeEditorToolbar = requestAnimationFrame(sticky);
                    }

                    $(window).on('resize', function () {
                        if(element.parents('.editor-media').length > 0){
                            return;
                        }
                        highlightZone.css({ top: (element.find('editor-toolbar').height() + 1) + 'px' });
                        if($(window).width() > ui.breakpoints.tablette){
                            toolbarElement.css({ 'position': 'relative' });
                            cancelAnimationFrame(placeEditorToolbar);
                            var placeEditorToolbar = requestAnimationFrame(sticky);
                        }
                        else{
                            cancelAnimationFrame(placeEditorToolbar);
                        }
                        placeToolbar();
                        editorInstance.trigger('contentupdated');
                    });

                    element.children('popover').find('li:first-child').on('click', function(){
                        element.removeClass('html');
                        element.removeClass('both');
                        element.addClass('edit');
                        editorInstance.trigger('contentupdated');
                    });

                    element.children('popover').find('li:nth-child(2)').on('click', function(){
                        element.removeClass('edit');
                        element.removeClass('both');
                        element.addClass('html');
                        highlightZone.css({ top: (element.find('editor-toolbar').height() + 1) + 'px' });
                        editorInstance.trigger('contentupdated');
                        setTimeout(function () {
                            editorInstance.trigger('contentupdated');
                        }, 300);
                        if(window.html_beautify){
                            return;
                        }
                        http().get('/infra/public/js/beautify-html.js').done(function(content){
                            eval(content);
                            htmlZone.val(window.html_beautify(ngModel(scope)));
                            highlightZone.text(window.html_beautify(ngModel(scope)));
                            Prism.highlightAll();
                        });
                    });

                    element.children('popover').find('li:nth-child(3)').on('click', function(){
                        element.removeClass('edit');
                        element.removeClass('html');
                        element.addClass('both');
                        highlightZone.css({ top: (element.find('editor-toolbar').height() + 1) + 'px' });
                        editorInstance.trigger('contentupdated');
                        setTimeout(function () {
                            editorInstance.trigger('contentupdated');
                        }, 300);
                        if(window.html_beautify){
                            return;
                        }
                        http().get('/infra/public/js/beautify-html.js').done(function(content){
                            eval(content);
                            htmlZone.val(window.html_beautify(ngModel(scope)));
                            highlightZone.text(window.html_beautify(ngModel(scope)));
                            Prism.highlightAll();
                        });
                    });

                    function b64toBlob(b64Data, contentType, sliceSize) {
                        contentType = contentType || '';
                        sliceSize = sliceSize || 512;

                        var byteCharacters = atob(b64Data);
                        var byteArrays = [];

                        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                            var slice = byteCharacters.slice(offset, offset + sliceSize);

                            var byteNumbers = new Array(slice.length);
                            for (var i = 0; i < slice.length; i++) {
                            byteNumbers[i] = slice.charCodeAt(i);
                            }

                            var byteArray = new Uint8Array(byteNumbers);

                            byteArrays.push(byteArray);
                        }

                        var blob = new Blob(byteArrays, { type: contentType });
                        blob.name = "image";
                        return blob;
                    }

                    element.find('.option i').click(function(){
                        if(!editZone.is(':focus')){
                            editZone.focus();
                        }

                        scope.$apply(function(){
                            scope.$eval(attributes.ngChange);
                            let content = editZone.html();
                            ngModel.assign(scope, content);
                        });
                    });

                    editorInstance.on('change', function(){
                        editorInstance.trigger('contentupdated');
                        setTimeout(function(){
                            
                            if(attributes.onChange){
                                scope.$eval(attributes.onChange);
                            }
                            
                            scope.$apply();
                        }, 10);
                    });

                    editorInstance.on('contentupdated', function () {
                        if(parseInt(htmlZone.css('min-height')) < editZone.height()){
                            htmlZone.css('min-height', editZone.height() + 'px');
                        }
                        ui.extendElement.resizable(element.find('[contenteditable]').find('table, .column'), {
                            moveWithResize: false,
                            mouseUp: function() {
                                editorInstance.trigger('contentupdated');
                                editorInstance.addState(editorInstance.editZone.html());
                            },
                            extendParent: { bottom: true }
                        });
                        editZone.find('[ng-repeat]').removeAttr('ng-repeat');
                        htmlZone.css({ 'min-height': '250px', height: 0 });
                        var newHeight = htmlZone[0].scrollHeight + 2;
                        if(newHeight > htmlZone.height()){
                            htmlZone.height(newHeight);
                        }

                        if (htmlZone[0].scrollHeight > parseInt(htmlZone.css('min-height')) && !element.hasClass('edit')) {
                            editZone.css('min-height', htmlZone[0].scrollHeight + 2 + 'px');
                        }

                        if(editorInstance.selection.changed()){
                            editorInstance.trigger('selectionchange', {
                                selection: editorInstance.selection
                            });
                        }

                        const save64 = async (item) => {
                            var split = $(item).attr('src').split('data:')[1].split(',');
                            var blob = (b64toBlob as any)(split[1], split[0].split(';')[0]);
                            blob.name = 'image';
                            $(item).attr('src', 'http://loading');
                            const doc = new Document();
                            const file = await doc.upload(blob)
                            $(item).attr('src', '/workspace/document/' + file._id);
                            notify.info('editor.b64.uploaded');
                            editorInstance.trigger('contentupdated');
                        };

                        editZone.find('img').each(function(index, item){
                            if($(item).attr('src') && $(item).attr('src').startsWith('data:')){
                                save64(item);
                            }
                        });

                        if (!scope.$$phase) {
                            scope.$apply(function () {
                                scope.$eval(attributes.ngChange);
                                let content = editZone.html();
                                $(content).find('mathjax').html('');
                                ngModel.assign(scope, content);
                            });
                        }
                        else {
                            scope.$eval(attributes.ngChange);
                            let content = editZone.html();
                            $(content).find('mathjax').html('');
                            ngModel.assign(scope, content);
                        }
                    });

                    var placeToolbar = function () {
                        if(element.parents('.editor-media').length > 0){
                            return;
                        }
                        if (attributes.inline !== undefined && $(window).width() > ui.breakpoints.tablette) {
                            element.children('editor-toolbar').css({
                                left: 0
                            });
                            element.css({ 'padding-top': toolbarElement.height() + 1 + 'px' });
                        }
                        else if($(window).width() < ui.breakpoints.tablette){
                            element.css({ 'padding-top': '' });
                        }
                    }

                    element.parents().on('resizing', placeToolbar)
                    element.on('click', function(e){
                        placeToolbar();

                        if(e.target === element.find('.close-focus')[0] || element.hasClass('focus')){
                            return;
                        }

                        element.trigger('editor-focus');
                        element.addClass('focus');
                        element.parent().data('lock', true);
                        element.parents('grid-cell').data('lock', true);
                        if ($(window).width() < ui.breakpoints.tablette) {
                            $('body').css({ overflow: 'hidden' });
                            window.scrollTo(0,0);
                            setTimeout(function(){
                                var sel = document.getSelection();
                                var r = document.createRange();
                                r.setStart(editZone[0].firstChild, 0);
                                sel.removeAllRanges();
                                sel.addRange(r);
                            }, 600);
                        }
                    });

                    $('body').on('mousedown', function(e){
                        if(e.target !== element.find('.editor-toolbar-opener')[0] && element.find('editor-toolbar, .editor-toolbar-opener').find(e.target).length === 0){
                            element.find('editor-toolbar').removeClass('opened');
                            element.find('.editor-toolbar-opener').removeClass('active');
                        }

                        if (element.find(e.target).length === 0 && !$(e.target).hasClass('sp-choose') && element.hasClass('focus') && !$(e.target).parents('.image-contextual-menu').length) {
                            element.children('editor-toolbar').removeClass('show');
                            element.removeClass('focus');
                            let content = editZone.html();
                            ngModel.assign(scope, content);
                            element.trigger('editor-blur');
                            editorInstance.trigger('change');
                            editorInstance.trigger('blur');
                            $('body').css({ overflow: 'auto' });
                            element.parent().data('lock', false);
                            element.parents('grid-cell').data('lock', false);
                            element.find('code').attr('style', '');

                            if(attributes.inline !== undefined){
                                element.css({
                                    'margin-top': 0,
                                    'padding-top': 0
                                });
                                element.children('editor-toolbar').attr('style', '');
                            }
                        }
                    });

                    $('editor-toolbar').on('mousedown', function(e){
                        e.preventDefault();
                    });

                    function wrapFirstLine() {
                        if (editZone.contents()[0] && editZone.contents()[0].nodeType === 3) {
                            var div = $('<div></div>');
                            div.text(editZone.contents()[0].textContent);
                            $(editZone.contents()[0]).remove();
                            editZone.prepend(div);
                            editorInstance.selection.moveCaret(div[0], div.text().length);
                            editorInstance.trigger('contentupdated');
                        }
                    }

                    function editingDone(){
                        editorInstance.addState(editZone.html());
                    }

                    var typingTimer;
                    var editingTimer;

                    editZone.on('paste', function () {
                        setTimeout(function(){
                            editorInstance.editZone.find('[resizable]').removeAttr('resizable').css('cursor', 'initial');
                            editorInstance.editZone.find('[bind-html]').removeAttr('bind-html');
                            editorInstance.editZone.find('[ng-include]').removeAttr('ng-include');
                            editorInstance.editZone.find('[ng-repeat]').removeAttr('ng-repeat');
                            editorInstance.editZone.find('[data-ng-repeat]').removeAttr('data-ng-repeat');
                            editorInstance.editZone.find('[ng-transclude]').removeAttr('ng-transclude');
                            if(editorInstance.editZone.find('portal').length){
                                var portal = editorInstance.editZone.find('portal');
                                editorInstance.editZone[0].innerHTML = $('<div>' + (portal.find('[bind-html]').html() || '') + '</div>')
                            }
                            editorInstance.addState(editZone.html());
                            if(editorInstance.editZone[0].childNodes.length > editorInstance.editZone[0].children.length){
                                var wrapper = $('<div></div>');
                                while(editorInstance.editZone[0].childNodes.length){
                                    wrapper.append(editorInstance.editZone[0].childNodes[0]);
                                }
                                editorInstance.editZone.append(wrapper);
                            }
                            editorInstance.trigger('contentupdated');
                            editorInstance.scope.$apply();
                        }, 100);
                    });

                    editZone.on('keydown', function (e) {
                        clearTimeout(typingTimer);
                        clearTimeout(editingTimer);
                        typingTimer = setTimeout(wrapFirstLine, 10);
                        
                        var sel = window.getSelection();
                        if (sel.rangeCount > 0) {
                            var range = sel.getRangeAt(0);
                            if (range.startContainer.nodeType !== 1 && e.which > 64 && e.which < 91 && range.startContainer.parentNode !== null) {     
                                var currentTextNode = range.startContainer;
                                var initialOffset = range.startOffset;
                                if (initialOffset === currentTextNode.textContent.length) {
                                    initialOffset = -1;
                                }
                                if (range.startContainer.parentNode.innerHTML === '&#8203;' && range.startOffset === 1) {
                                    var node = range.startContainer.parentNode;
                                    
                                    setTimeout(function () {
                                        node.innerHTML = node.innerHTML.substring(7);
                                        setTimeout(function () {
                                            var range = document.createRange();
                                            if (initialOffset === -1) {
                                                initialOffset = (node.firstChild || node).textContent.length
                                            }
                                            range.setStart((node.firstChild || node), initialOffset);
                                            sel.removeAllRanges();
                                            sel.addRange(range);
                                        }, 1);
                                    }, 1);
                                    
                                }
                            }
                        }
                        

                        if (!e.ctrlKey) {
                            editingTimer = setTimeout(editingDone, 500);
                        }

                        if (e.keyCode === 13) {
                            onPressEnter(e, range, editorInstance, editZone, textNodes);
                        }

                        if (e.keyCode === 8 || e.keyCode === 46) {
                            editorInstance.addState(editZone.html());
                            // for whatever reason, ff likes to create several ranges for table selection
                            // which messes up their deletion
                            for (var i = 0; i < sel.rangeCount; i++) {
                                var startContainer = sel.getRangeAt(i).startContainer;
                                if (startContainer.nodeType === 1 && startContainer.nodeName === 'TD' || startContainer.nodeName === 'TR') {
                                    (startContainer as any).remove();
                                }
                            }
                            editZone.find('table').each(function (index, item) {
                                if ($(item).find('tr').length === 0) {
                                    $(item).remove();
                                }
                            });
                        }
                        if (e.ctrlKey && e.keyCode === 86) {
                            setTimeout(function() {
                                editorInstance.editZone.find('i').contents().unwrap().wrap('<em/>');
                                editorInstance.addState(editorInstance.editZone.html());
                            }, 0);
                        }
                        if(e.keyCode === 90 && e.ctrlKey && !e.shiftKey){
                            editorInstance.undo();
                            e.preventDefault();
                            scope.$apply();
                        }
                        if((e.keyCode === 90 && e.ctrlKey && e.shiftKey) || (e.keyCode === 89 && e.ctrlKey)){
                            editorInstance.redo();
                            e.preventDefault();
                            scope.$apply();
                        }
                        if(e.keyCode === 9){
                            e.preventDefault();
                            var currentTag;
                            if(editorInstance.selection.range.startContainer.tagName){
                                currentTag = editorInstance.selection.range.startContainer;
                            }
                            else{
                                currentTag = editorInstance.selection.range.startContainer.parentNode;
                            }
                            if(currentTag.tagName === 'TD'){
                                var nextTag = currentTag.nextSibling;
                                if(!nextTag){
                                    nextTag = $(currentTag).parent('tr').next().children('td')[0];
                                }
                                if(!nextTag){
                                    var newLine = $('<tr></tr>');
                                    for(var i = 0; i < $(currentTag).parent('tr').children('td').length; i++){
                                        newLine.append($('<td><br /></td>'));
                                    }
                                    nextTag = newLine.children('td')[0];
                                    $(currentTag).closest('table').append(newLine);
                                }
                                editorInstance.selection.moveCaret(nextTag, nextTag.firstChild.textContent.length);
                            }
                            else if (currentTag.tagName === 'LI') {
                                document.execCommand('indent');
                            }
                            else {
                                editorInstance.selection.range.insertNode($('<span style="padding-left: 25px;">&#8203;</span>')[0]);
                            }
                        }
                    });

                    editZone.on('keyup', function(e){
                        htmlZone.css({ 'min-height': '250px', height: 0 });
                        var newHeight = htmlZone[0].scrollHeight + 2;
                        if(newHeight > htmlZone.height()){
                            htmlZone.height(newHeight);
                        }
                    });

                    editorInstance.on('contentupdated', function (e) {
                        htmlZone.css({ 'min-height': '250px', height: 0 });
                        editZone.css({ 'min-height': '250px' });
                        var newHeight = htmlZone[0].scrollHeight + 2;
                        if (newHeight > htmlZone.height()) {
                            htmlZone.height(newHeight);
                        }
                        if (newHeight > parseInt(editZone.css('min-height')) && !element.hasClass('edit')) {
                            editZone.css('min-height', newHeight);
                        }

                        scope.$apply(function(){
                            scope.$eval(attributes.ngChange);
                            ngModel.assign(scope, htmlZone.val());
                        });
                    });

                    htmlZone.on('keydown', function (e) {
                        // free main thread so it can render textarea changes
                        setTimeout(function () {
                            highlightZone.text($(this).val());
                            Prism.highlightAll();
                        }.bind(this), 200);
                        if(e.keyCode === 9){
                            e.preventDefault();
                            var start = this.selectionStart;
                            var end = this.selectionEnd;

                            $(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));

                            this.selectionStart = this.selectionEnd = start + 1;
                        }
                    });

                    htmlZone.on('blur', function(){
                        scope.$apply(function(){
                            scope.$eval(attributes.ngChange);
                            ngModel.assign(scope, htmlZone.val());
                        });
                        editorInstance.trigger('change');
                    });

                    element.find('[contenteditable]').on('drop', function (e) {
                        onDropFromDesktop(e, editorInstance, element);
                    });

                    scope.$on('$destroy', function () {
                        cancelAnimationFrame(placeEditorToolbar);
                    });
                }
            };
        }]);


        //Style directives
        module.directive('popover', function(){
            return {
                controller: function(){},
                restrict: 'E',
                link: function (scope, element, attributes) {
                    element.on('close', function(){
                        if(attributes.onClose){
                            scope.$eval(attributes.onClose);
                        }
                    });
                }
            };
        });

        module.directive('popoverOpener', function(){
            return {
                require: '^popover',
                link: function(scope, element, attributes){
                    var parentNode = element.parents('popover');
                    var mouseEvent = parentNode.attr('mouse-event') || 'mouseover';
                    var popover = parentNode.find('popover-content');
                    parentNode.on(mouseEvent, function (e) {
                        if (mouseEvent === 'click') {
                            if (popover.hasClass('hidden')) {
                                e.stopPropagation();
                            }

                            $('body').one('click', function (e) {
                                parentNode.trigger('close');
                                popover.addClass("hidden");
                            });
                        }

                        if(popover.offset().left + popover.width() > $(window).width()){
                            popover.addClass('right');
                        }
                        if(popover.offset().left < 0){
                            popover.addClass('left');
                        }
                        if(popover.offset().top + popover.height() > $(window).height()){
                            popover.addClass('bottom');
                        }
                        popover.removeClass("hidden");
                    });

                        if(mouseEvent === 'mouseover') {
                        parentNode.on('mouseout', function (e) {
                            parentNode.trigger('close');
                            popover.addClass("hidden");
                        });
                    }
                }
            };
        });

        module.directive('popoverContent', function(){
            return {
                require: '^popover',
                restrict: 'E',
                link: function(scope, element, attributes){
                    element.addClass("hidden");
                }
            };
        });

        module.directive('mathjax', function(){
            return {
                restrict: 'E',
                scope: {
                    formula: '@'
                },
                link: function (scope, element, attributes) {
                    if (!window.MathJax && !(window as any).MathJaxLoading) {
                        let script = $('<script></script>')
                            .attr('src', '/infra/public/mathjax/MathJax.js')
                            .appendTo('head');
                            
                            script[0].async = false;
                            window.MathJax.Hub.Config({
                                messageStyle: 'none',
                                tex2jax: { preview: 'none' },
                                jax: ["input/TeX", "output/CommonHTML"],
                                extensions: ["tex2jax.js", "MathMenu.js", "MathZoom.js"],
                                TeX: {
                                    extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"]
                                }
                            });
                            $('.MathJax_CHTML_Display').remove();
                            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
                    }

                    scope.updateFormula = function(newVal){
                        element.text('$$' + newVal + '$$');
                        if (window.MathJax && window.MathJax.Hub) {
                            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
                        }
                    };

                    attributes.$observe('formula', function(newVal){
                        scope.updateFormula(newVal);
                    });
                }
            }
        });
    }
};

if(!window.entcore){
    window.entcore = {};
}

window.entcore.RTE = RTE;
