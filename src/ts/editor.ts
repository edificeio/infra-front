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

        // Editor options
        RTE.baseToolbarConf.option('ulist', function(instance){
            return {
                template: '<i tooltip="editor.option.ulist"></i>',
                link: function(scope, element, attributes){
                    element.on('mousedown', function () {

                        if(!instance.editZone.is(':focus')){
                            instance.editZone.focus();
                        }

                        if (instance.editZone.children('div').length === 0) {
                            instance.editZone.append('<div><br></div>');
                            instance.editZone.focus();
                        }

                        instance.execCommand('insertUnorderedList', false, null);
                        if(document.queryCommandState('insertUnorderedList')){
                            element.addClass('toggled');
                        }
                        else{
                            element.removeClass('toggled');
                        }
                    });

                    instance.on('selectionchange', function(e){
                        if(document.queryCommandState('insertUnorderedList')){
                            element.addClass('toggled');
                        }
                        else{
                            element.removeClass('toggled');
                        }
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('olist', function(instance){
            return {
                template: '<i tooltip="editor.option.olist"></i>',
                link: function(scope, element, attributes){
                    element.on('mousedown', function(){
                        if(!instance.editZone.is(':focus')){
                            instance.editZone.focus();
                        }

                        if (instance.editZone.children('div').length === 0) {
                            instance.editZone.append('<div><br></div>');
                            instance.editZone.focus();
                        }

                        instance.execCommand('insertOrderedList', false, null);
                        if(document.queryCommandState('insertOrderedList')){
                            element.addClass('toggled');
                        }
                        else{
                            element.removeClass('toggled');
                        }
                    });

                    instance.on('selectionchange', function(e){
                        if(document.queryCommandState('insertOrderedList')){
                            element.addClass('toggled');
                        }
                        else{
                            element.removeClass('toggled');
                        }
                    });
                }
            };
        });

        function setSpectrum(el){
            if($('.sp-replacer').length === 0){
                return;
            }
            
            el.children('i').css({ 'pointer-events': 'none' });
            $('input[type=color]').css({
                position: 'absolute',
                opacity: 0,
                'pointer-events': 'none',
                height: '35px'
            });
            $('.sp-replacer').on('mouseover', function(e){ 
                $(e.target).parent().find('input[type=color]').trigger('mouseover', [e]);
            });
            $('.sp-replacer').on('mouseout', function(e){ 
                $(e.target).parent().find('input[type=color]').trigger('mouseout', [e]);
            });
        } 

        RTE.baseToolbarConf.option('color', function(instance){
            return {
                template: '<i tooltip="editor.option.color"></i>' +
                    '<input tooltip="editor.option.color" type="color" />',
                link: function (scope, element, attributes) {
                    element.on('click', 'i', function () {
                        element.find('input').click();
                    });
                    if (navigator.userAgent.indexOf('Edge') !== -1) {
                        element.find('input').attr('type', 'text');
                    }
                    if (!$.spectrum) {
                        $.spectrum = {};
                        http().get('/infra/public/spectrum/spectrum.js').done(function(data){
                            eval(data);
                            setSpectrum(element);
                            if ($.spectrum && $.spectrum.palettes && element.find('input')[0].type === 'text') {
                                $('body').find('.option.color input, .option.background-color input').spectrum({preferredFormat: "hex"});
                                setSpectrum(element);
                            }
                        });
                        var stylesheet = $('<link rel="stylesheet" type="text/css" href="/infra/public/spectrum/spectrum.css" />');
                        $('head').prepend(stylesheet);
                    }
                    if ($.spectrum && $.spectrum.palettes && element.find('input')[0].type === 'text') {
                        element.find('input').spectrum({ preferredFormat: "hex" });
                        setSpectrum(element);
                    }
                    scope.foreColor = "#000000";
                    element.children('input').on('change', function(){
                        scope.foreColor = $(this).val();
                        scope.$apply('foreColor');
                    });

                    scope.$watch('foreColor', function(){
                        if(scope.foreColor !== eval(instance.selection.css('color')) && !(instance.selection.isEmpty() && scope.foreColor === '#000000')) {
                            instance.selection.css({ 'color': scope.foreColor });
                        }
                    });

                    instance.on('selectionchange', function(e){
                        scope.foreColor = eval(instance.selection.css('color'));
                        element.children('input').val(scope.foreColor);
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('backgroundColor', function(instance){
            return {
                template: '<i></i><input tooltip="editor.option.backgroundcolor" type="color" />',
                link: function(scope, element, attributes){
                    element.on('click', 'i', function () {
                        element.find('input').click();
                    });
                    if (navigator.userAgent.indexOf('Edge') !== -1) {
                        element.find('input').attr('type', 'text');
                    }
                    if(!$.spectrum){
                        $.spectrum = {};
                        http().get('/infra/public/spectrum/spectrum.js').done(function(data){
                            eval(data);
                            if ($.spectrum && $.spectrum.palettes && element.find('input')[0].type === 'text') {
                                $('body').find('.option.color input, .option.background-color input').spectrum({ preferredFormat: "hex" });
                                setSpectrum(element);
                            }
                        });
                        var stylesheet = $('<link rel="stylesheet" type="text/css" href="/infra/public/spectrum/spectrum.css" />');
                        $('head').prepend(stylesheet);
                    }
                    else if ($.spectrum && $.spectrum.palettes && element.find('input')[0].type === 'text') {
                        element.find('input[type=color]').spectrum({ preferredFormat: "hex" });
                        setSpectrum(element);
                    }
                    element.children('input').on('change', function () {
                        if (!$(this).val()) {
                            return;
                        }
                        scope.backColor = $(this).val();
                        scope.$apply('backColor');
                    });

                    scope.$watch('backColor', function () {
                        var rgbColor = {} as any;
                        if (typeof scope.backColor === 'string') {
                            if(scope.backColor[0] === '#'){
                                rgbColor = {
                                    r: parseInt(scope.backColor.substring(1, 3), 16),
                                    g: parseInt(scope.backColor.substring(3, 5), 16),
                                    b: parseInt(scope.backColor.substring(5, 7), 16)
                                }
                            }
                            else if (scope.backColor.startsWith('rgb')) {
                                var spl = scope.backColor.split('(')[1].split(',');
                                rgbColor = {
                                    r: parseInt(spl[0]),
                                    g: parseInt(spl[1]),
                                    b: parseInt(spl[2]),
                                    a: parseInt(spl[3])
                                }
                            }
                        
                            if (rgbColor.r > 130 && rgbColor.g > 130 && rgbColor.b > 130 && rgbColor.a !== 0) {
                                element.find('i').css({ 'color': '#000' });
                            }
                            else {
                                element.find('i').css({ 'color': '#fff' });
                            }
                        }
                        
                        if(scope.backColor !== eval(instance.selection.css('background-color')) && rgbColor.a !== 0 && scope.backColor) {
                            instance.selection.css({ 'background-color': scope.backColor });
                        }
                    });

                    instance.on('selectionchange', function(e){
                        scope.backColor = eval(instance.selection.css('background-color'));
                        if (scope.backColor === 'rgba(255, 255, 255, 0)') {
                            scope.backColor = '';
                        }
                        element.children('input').val(scope.backColor);
                        scope.$apply('backColor');
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('fontSize', function(instance) {
            return {
                template: '<select-list placeholder="size" display="font.fontSize.size" tooltip="editor.option.fontSize">' +
                '<opt ng-repeat="fontSize in font.fontSizes" ng-click="setSize(fontSize)" ' +
                    'ng-style="{ \'font-size\': fontSize.size + \'px\', \'line-height\': fontSize.size + \'px\'}">' +
                        '[[fontSize.size]]' +
                    '</opt>' +
                '</select-list>',
                link: function (scope, element, attributes) {
                    scope.font = {
                        fontSizes: [{ size: 8 }, { size: 10 }, { size: 12 }, { size: 14 },
                            { size: 16 }, { size: 18 }, { size: 20 }, { size: 24 }, { size: 28 },
                            { size: 34 }, { size: 42 }, { size: 64 }, { size: 72 }],
                        fontSize: {}
                    };

                    scope.setSize = function (fontSize) {
                        scope.font.fontSize = { size: fontSize.size };
                        instance.selection.css({
                            'font-size': fontSize.size + 'px',
                            'line-height': fontSize.size + 'px'
                        });
                    };

                    instance.on('selectionchange', function (e) {
                        if (instance.selection.css('font-size')) {
                            scope.font.fontSize = { size: parseInt(instance.selection.css('font-size')) };
                        }
                        else {
                            scope.font.fontSize = { size: undefined };
                        }

                    });

                    element.children('.options').on('click', 'opt', function () {
                        element.children('.options').addClass('hidden');
                    });
                }
            }
        });

        RTE.baseToolbarConf.option('subscript', function (instance) {
            return {
                template: '<i tooltip="editor.option.subscript"></i>',
                link: function (scope, element, attributes) {
                    element.on('click', function () {
                        if (!instance.editZone.is(':focus')) {
                            instance.focus();
                        }

                        if (instance.selection.css('vertical-align') !== 'sub') {
                            element.addClass('toggled');
                            instance.selection.css({ 'vertical-align': 'sub', 'font-size': '12px' });
                        }
                        else {
                            element.removeClass('toggled');
                            instance.selection.css({ 'vertical-align': '', 'font-size': '' });
                        }
                    });

                    instance.on('selectionchange', function (e) {
                        if (instance.selection.css('vertical-align') === 'sub') {
                            element.addClass('toggled');
                        }
                        else {
                            element.removeClass('toggled');
                        }
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('superscript', function (instance) {
            return {
                template: '<i tooltip="editor.option.superscript"></i>',
                link: function (scope, element, attributes) {
                    element.on('click', function () {
                        if (!instance.editZone.is(':focus')) {
                            instance.focus();
                        }

                        if (instance.selection.css('vertical-align') !== 'super') {
                            element.addClass('toggled');
                            instance.selection.css({ 'vertical-align': 'super', 'font-size': '12px' });
                        }
                        else {
                            element.removeClass('toggled');
                            instance.selection.css({ 'vertical-align': '', 'font-size': '' });
                        }
                    });

                    instance.on('selectionchange', function (e) {
                        if (instance.selection.css('vertical-align') === 'super') {
                            element.addClass('toggled');
                        }
                        else {
                            element.removeClass('toggled');
                        }
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('removeFormat', function (instance) {
            return {
                template: '<i tooltip="editor.option.removeformat"></i>',
                link: function (scope, element, attributes) {
                    element.on('click', function () {
                        if (!instance.editZone.is(':focus')) {
                            instance.focus();
                        }

                        var format = {
                            'font-style': 'normal',
                            'background-color': 'transparent',
                            'font-weight': 'normal',
                            'text-decoration': 'none',
                            'color': 'inherit',
                            'font-size': 'initial',
                            'line-height': 'initial',
                            'font-family': 'inherit'
                        };

                        instance.selection.css(format);
                        instance.execCommand('removeFormat');
                        instance.trigger('selectionchange', { selection: instance.selection });
                    });

                    instance.on('selectionchange', function (e) {
                        if (document.queryCommandEnabled('removeFormat')) {
                            element.removeClass('disabled');
                        }
                        else {
                            element.addClass('disabled');
                        }
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('sound', function(instance){
            return {
                template: '<i ng-click="soundOption.display.pickFile = true" tooltip="editor.option.sound"></i>' +
                '<div ng-if="soundOption.display.pickFile">' +
                '<lightbox show="soundOption.display.pickFile" on-close="soundOption.display.pickFile = false;">' +
                '<media-library ng-change="updateContent()" ng-model="soundOption.display.file" file-format="\'audio\'" visibility="soundOption.visibility"></media-library>' +
                '</lightbox>' +
                '</div>',
                link: function(scope, element, attributes){
                    instance.editZone.addClass('drawing-zone');
                    scope.soundOption = {
                        display: { pickFile: false },
                        visibility: 'protected'
                    }

                    if (instance.visibility === 'public') {
                        scope.soundOption.visibility = 'public'
                    }
                    scope.updateContent = function () {
                        var path = '/workspace/document/';
                        if (scope.soundOption.visibility === 'public') {
                            path = '/workspace/pub/document/';
                        }

                        instance.selection.replaceHTML(
                            '<div><br /></div>' +
                            '<div class="audio-wrapper"><audio src="' + path + scope.soundOption.display.file._id + '" controls preload="none"></audio></div>' +
                            '<div><br /></div>'
                        );
                        scope.soundOption.display.pickFile = false;
                        scope.soundOption.display.file = undefined;
                    };
                }
            }
        });

        RTE.baseToolbarConf.option('embed', function (instance) {
            return {
                template: '<i ng-click="display.copyEmbed = true" tooltip="editor.option.embed"></i>' +
                '<embedder ng-model="display.htmlCode" on-change="applyHtml()" show="display.copyEmbed"></embedder>',
                link: function (scope, element, attributes) {
                    scope.display = {
                        htmlCode: ''
                    };

                    scope.applyHtml = function (template) {
                        instance.selection.replaceHTML(scope.display.htmlCode);
                    };
                }
            }
        });

        RTE.baseToolbarConf.option('mathjax', function(instance){
            return {
                template: '<i ng-click="display.fillFormula = true" tooltip="editor.option.mathjax"></i>' +
                '<lightbox show="display.fillFormula" on-close="display.fillFormula = false;">' +
                '<textarea ng-model="display.formula"></textarea>' +
                '<mathjax formula="[[display.formula]]"></mathjax>' +
                '<div class="row">' +
                '<button type="button" ng-click="updateContent()" class="right-magnet"><i18n>apply</i18n></button>' +
                '<button type="button" ng-click="cancel()" class="right-magnet cancel"><i18n>cancel</i18n></button>' +
                '</div>' +
                '</lightbox>',
                link: function(scope, element, attributes){
                    scope.display = {
                        formula: '{-b \\pm \\sqrt{b^2-4ac} \\over 2a}'
                    };
                    
                    var editNode = undefined;
                    
                    scope.updateContent = function(){
                        if(editNode){
                            $(editNode).attr('formula', scope.display.formula);
                            angular.element(editNode.firstChild).scope().updateFormula(scope.display.formula);
                            instance.trigger('change');
                        }
                        else{
                            instance.selection.replaceHTMLInline(instance.compile(
                                '<span>&nbsp;<mathjax contenteditable="false" formula="'+ scope.display.formula + '"></mathjax>&nbsp;</span>'
                            )(scope));
                        }
                        
                        scope.display.fillFormula = false;
                        editNode = undefined;
                    };
                    
                    scope.cancel = function(){
                        editNode = undefined;
                        scope.display.fillFormula = false;
                    };
                    
                    instance.bindContextualMenu(scope, 'mathjax', [
                        {
                            label: 'editor.edit.mathjax',
                            action: function (e) {
                                instance.selection.selectNode(e.target);
                                scope.display.fillFormula = true;
                                scope.display.formula = $(e.target).attr('formula');
                                editNode = e.target;
                            }

                        },
                        {
                            label: 'editor.remove.mathjax',
                            action: function (e) {
                                $(e.target).remove();
                            }
                        }
                    ]);
                }
            }
        });

        RTE.baseToolbarConf.option('linker', function(instance){
            return {
                template: '<i ng-click="linker.openLinker()" tooltip="editor.option.link"></i>' +
                '<div ng-include="\'/infra/public/template/linker.html\'"></div>',
                link: function (scope, element, attributes) {
                    ui.extendSelector.touchEvents('[contenteditable] a');
                    scope.linker = {
                        display: {},
                        apps: [],
                        search: {
                            application: {},
                            text: ''
                        },
                        params: {},
                        resource: {}
                    };

                    instance.bindContextualMenu(scope, 'a', [
                        {
                            label: 'editor.edit.link',
                            action: function (e) {
                                instance.selection.selectNode(e.target);
                                scope.linker.display.chooseLink = true;
                                scope.linker.openLinker($(e.target).data('app-prefix'), $(e.target).attr('href'), e.target);
                            }

                        },
                        {
                            label: 'editor.remove.link',
                            action: function (e) {
                                var content = document.createTextNode($(e.target).text());
                                e.target.parentNode.insertBefore(content, e.target);
                                $(e.target).remove();
                            }
                        }
                    ]);

                    scope.linker.openLinker = function (appPrefix, address, element) {
                        var sel = window.getSelection();
                        instance.selection.range = sel.getRangeAt(0);
                        this.rangeCount = 1;
                        scope.linker.display.chooseLink = true;
                        if (appPrefix) {
                            scope.linker.search.application.address = '/' + appPrefix;
                            scope.linker.loadApplicationResources(function () {
                                scope.linker.searchApplication(function () {
                                    var resource = _.findWhere(scope.linker.resources, { path: address });
                                    scope.linker.applyResource(resource);
                                    scope.$apply();
                                });
                            });
                        }
                        else {
                            if (!element && instance.selection.selectedElements.length === 1) {
                                element = instance.selection.selectedElements[0];
                            }
                            if (element) {
                                if (element.nodeType !== 1) {
                                    element = element.parentNode;
                                }
                                if (element.nodeName === 'A') {
                                    var link = $(element).attr('href');
                                    scope.linker.params.blank = $(element).attr('target') === '_blank';
                                    scope.linker.params.tooltip = $(element).attr('tooltip') || '';

                                    if (link.split('http')[0] === '' && link.split('http').length > 1) {
                                        scope.linker.externalLink = true;
                                        scope.linker.params.link = link;
                                    }
                                    else {
                                        scope.linker.externalLink = false;
                                        scope.linker.openLinker(link.split('/')[1].split('#')[0], link);
                                    }
                                }
                            }
                        }
                    };

                    scope.linker.loadApplicationResources = function(cb){
                        var split = scope.linker.search.application.address.split('/');
                        var prefix = split[split.length - 1];
                        scope.linker.params.appPrefix = prefix;
                        if(!cb){
                            cb = function(){
                                scope.linker.searchApplication();
                                scope.$apply('linker');
                            };
                        }
                        Behaviours.loadBehaviours(scope.linker.params.appPrefix, function (appBehaviour) {
                            const result = Behaviours.applicationsBehaviours[prefix].loadResources(() => cb(Behaviours.applicationsBehaviours[prefix].resources));
                            if(result && result.then){
                                result.then(() => {
                                    cb(Behaviours.applicationsBehaviours[prefix].resources);
                                });
                            }
                            scope.linker.addResource = Behaviours.applicationsBehaviours[prefix].create;
                        });
                    };

                    scope.linker.searchApplication = function(cb){
                        var split = scope.linker.search.application.address.split('/');
                        var prefix = split[split.length - 1];
                        scope.linker.params.appPrefix = prefix;
                        Behaviours.loadBehaviours(scope.linker.params.appPrefix, function(appBehaviour){
                            scope.linker.resources = _.filter(appBehaviour.resources, function(resource) {
                                return scope.linker.search.text !== '' && (lang.removeAccents(resource.title.toLowerCase()).indexOf(lang.removeAccents(scope.linker.search.text).toLowerCase()) !== -1 ||
                                    resource._id === scope.linker.search.text);
                            });
                            if(typeof cb === 'function'){
                                cb();
                            }
                        });
                    };

                    scope.linker.createResource = function(){
                        Behaviours.loadBehaviours(scope.linker.params.appPrefix, function(appBehaviour){
                            appBehaviour.create(scope.linker.resource, function(){
                                scope.linker.search.text = scope.linker.resource.title;
                                
                                scope.linker.searchApplication();
                                scope.$apply();
                            });
                        });
                    };

                    scope.linker.applyLink = function(link){
                        scope.linker.params.link = link;
                    };

                    scope.linker.applyResource = function(resource){
                        scope.linker.params.link = resource.path;
                        scope.linker.params.id = resource._id;
                    };

                    scope.linker.saveLink = function(){
                        if(scope.linker.params.blank){
                            scope.linker.params.target = '_blank';
                        }

                        var linkNode;
                        var selectedNode = instance.selection.range.startContainer;
                        if (selectedNode && selectedNode.nodeType !== 1
                            && selectedNode.parentNode.childNodes.length === 1
                            && instance.selection.range.startOffset === 0
                            && instance.selection.range.endOffset === selectedNode.textContent.length) {
                            selectedNode = selectedNode.parentNode;
                        }
                        if (selectedNode && selectedNode.nodeName === 'A') {
                            linkNode = $(selectedNode);
                        }
                        else {
                            linkNode = $('<a></a>');
                        }

                        if(scope.linker.params.link){
                            linkNode.attr('href', scope.linker.params.link);

                            if (scope.linker.params.appPrefix && !scope.linker.externalLink) {
                                linkNode.attr('data-app-prefix', scope.linker.params.appPrefix);
                                if(scope.linker.params.appPrefix !== 'workspace' && !scope.linker.externalLink){
                                    linkNode.data('reload', true);
                                }
                            }
                            if(scope.linker.params.id){
                                linkNode.attr('data-id', scope.linker.params.id);
                            }
                            if(scope.linker.params.blank){
                                scope.linker.params.target = '_blank';
                                linkNode.attr('target', scope.linker.params.target);
                            }
                            if(scope.linker.params.tooltip){
                                linkNode.attr('tooltip', scope.linker.params.tooltip);
                            }
                            else if(linkNode.attr('tooltip')){
                                linkNode.removeAttr('tooltip');
                                linkNode.off('mouseover');
                            }
                        }

                        if (selectedNode && selectedNode.nodeName === 'A') {
                            instance.selection.moveCaret(linkNode[0], linkNode.text().length);
                            instance.trigger('change');
                            scope.linker.display.chooseLink = false;
                            scope.linker.params = {};
                            scope.linker.display.search = {
                                application: {},
                                text: ''
                            };
                            scope.linker.externalLink = false;
                            return;
                        }

                        if (instance.selection.isCursor()) {
                            linkNode.text(scope.linker.params.link);
                            instance.selection.replaceHTMLInline(instance.compile(linkNode[0].outerHTML)(scope));
                        }
                        else {
                            instance.selection.wrapText(linkNode);
                        }

                        instance.focus();
                        scope.linker.display.chooseLink = false;
                        scope.linker.params = {};
                        scope.linker.display.search = {
                            application: {},
                            text: ''
                        };
                        scope.linker.externalLink = false;
                    };

                    scope.linker.cancel = function(){
                        scope.linker.display.chooseLink = false;
                        scope.linker.params = {};
                        scope.linker.display.search = {
                            application: {},
                            text: ''
                        };
                        scope.linker.externalLink = false;
                    };

                    http().get('/resources-applications').done(function(apps){
                        scope.linker.apps = _.filter(model.me.apps, function(app){
                            return _.find(
                                apps,
                                function (match) {
                                    return app.address.indexOf(match) !== -1 && app.icon && app.address.indexOf('#') === -1
                                }
                            );
                        });

                        scope.linker.apps = _.map(scope.linker.apps, function(app) {
                            app.displayName = lang.translate(app.displayName);
                            return app;
                        });

                        scope.linker.search.application = _.find(scope.linker.apps, function(app){ return app.address.indexOf(appPrefix) !== -1 });
                        if(!scope.linker.search.application){
                            scope.linker.search.application = scope.linker.apps[0];
                            scope.linker.searchApplication(function(){
                                scope.linker.loadApplicationResources(function(){});
                            })
                        }
                        else{
                            scope.linker.loadApplicationResources(function(){});
                        }

                        scope.$apply('linker');
                    });
                }
            }
        });

        RTE.baseToolbarConf.option('unlink', function(instance){
            return {
                template: '<i tooltip="editor.option.unlink"></i>',
                link: function(scope, element, attributes){
                    element.addClass('disabled');
                    element.on('click', function () {
                        var currentNode = instance.selection.range.startContainer;
                        if (currentNode.nodeType !== 1) {
                            currentNode = currentNode.parentNode;
                        }
                        if (currentNode.nodeName !== 'A') {
                            return;
                        }
                        var content = document.createTextNode($(currentNode).text());
                        currentNode.parentNode.insertBefore(content, currentNode);
                        $(currentNode).remove();
                        element.addClass('disabled');
                    });

                    instance.on('selectionchange', function (e) {
                        var currentNode = e.selection.range.startContainer;
                        if(currentNode.nodeType !==1){
                            currentNode = currentNode.parentNode;
                        }
                        if (currentNode.nodeName === 'A') {
                            element.removeClass('disabled');
                        }
                        else{
                            element.addClass('disabled');
                        }
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('smileys', function(instance){
            return {
                template: '' +
                '<i tooltip="editor.option.smileys"></i>' +
                '<lightbox show="display.pickSmiley" on-close="display.pickSmiley = false;">' +
                '<h2>Insérer un smiley</h2>' +
                '<div class="row smileys">' +
                '<img ng-repeat="smiley in smileys" class="smiley" ng-click="addSmiley(smiley)" skin-src="/img/smileys/[[smiley]].png" />' +
                '</div>' +
                '</lightbox>',
                link: function(scope, element, attributes){
                    scope.display = {};
                    scope.smileys = [ "happy", "proud", "dreamy", "love", "tired", "angry", "worried", "sick", "joker", "sad" ];
                    scope.addSmiley = function (smiley) {
                        //do not replace with i, as i is used by other websites for italic and
                        //is often copy-pasted in the editor
                        var content = instance.compile(
                            '<img skin-src="/img/smileys/' + smiley + '.png" class="smiley" />'
                        )(scope.$parent);
                        instance.selection.replaceHTMLInline(content);
                        scope.display.pickSmiley = false;
                    }

                    element.children('i').on('click', function(){
                        scope.display.pickSmiley = true;
                    });
                }
            };
        });

        RTE.baseToolbarConf.option('templates', function(instance){
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
                                    lang.translate('editor.templates.coltitle') +
                                    '</h2>' +
                                    '<p>' +
                                    lang.translate('editor.templates.colfiller') +
                                    '</p>' +
                                '</article>' +
                            '</div>' +
                            '<div class="six cell column">' +
                                '<article>' +
                                    '<h2>' +
                                    lang.translate('editor.templates.coltitle') +
                                    '</h2>' +
                                    '<p>' +
                                    lang.translate('editor.templates.colfiller') +
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
                                    lang.translate('editor.templates.coltitle') +
                                    '</h2>' +
                                    '<p>' +
                                    lang.translate('editor.templates.colfiller') +
                                    '</p>' +
                                '</article>' +
                            '</div>' +
                            '<div class="four cell column">' +
                                '<article>' +
                                    '<h2>' +
                                    lang.translate('editor.templates.coltitle') +
                                    '</h2>' +
                                    '<p>' +
                                    lang.translate('editor.templates.colfiller') +
                                    '</p>' +
                                '</article>' +
                            '</div>' +
                            '<div class="four cell column">' +
                                '<article>' +
                                    '<h2>' +
                                    lang.translate('editor.templates.coltitle') +
                                    '</h2>' +
                                    '<p>' +
                                    lang.translate('editor.templates.colfiller') +
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
                                '<div class="three cell column">' +
                                    '<article>' +
                                        '<img src="' + skinPath + 'image-default.svg" />' +
                                    '</article>' +

                                '</div>' +
                                '<div class="nine cell column">' +
                                    '<article>' +
                                        '<h2>' +
                                            lang.translate('editor.templates.illustration.titlefiller') +
                                        '</h2>' +
                                        '<p>' +
                                        lang.translate('editor.templates.illustration.textfiller') +
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
                                    '<div class="top">' +
                                        '<img src="' + skinPath + 'image-default.svg" class="fixed twelve cell" />' +
                                    '</div>' +
                                    '<div class="bottom">' +
                                        '<div class="content">' +
                                            lang.translate('editor.templates.dominos.textfiller') +
                                        '</div>' +
                                    '</div>' +
                                    '</section>' +
                                '</div>' +
                                '<div class="item">' +
                                    '<section class="domino blue">' +
                                        '<div class="top">' +
                                            '<img src="' + skinPath + 'image-default.svg" class="fixed twelve cell" />' +
                                        '</div>' +
                                        '<div class="bottom">' +
                                            '<div class="content">' +
                                                lang.translate('editor.templates.dominos.textfiller') +
                                            '</div>' +
                                        '</div>' +
                                    '</section>' +
                                '</div>' +
                                '<div class="item">' +
                                    '<section class="domino orange">' +
                                        '<div class="top">' +
                                            '<img src="' + skinPath + 'image-default.svg" class="fixed twelve cell" />' +
                                        '</div>' +
                                            '<div class="bottom">' +
                                            '<div class="content">' +
                                                lang.translate('editor.templates.dominos.textfiller') +
                                            '</div>' +
                                        '</div>' +
                                    '</section>' +
                                '</div>' +
                                '<div class="item">' +
                                    '<section class="domino purple">' +
                                        '<div class="top">' +
                                            '<img src="' + skinPath + 'image-default.svg" class="fixed twelve cell" />' +
                                        '</div>' +
                                        '<div class="bottom">' +
                                            '<div class="content">' +
                                                lang.translate('editor.templates.dominos.textfiller') +
                                            '</div>' +
                                        '</div>' +
                                    '</section>' +
                                '</div>' +
                                '<div class="item">' +
                                    '<section class="domino green">' +
                                        '<div class="top">' +
                                            '<img src="' + skinPath + 'image-default.svg" class="fixed twelve cell" />' +
                                        '</div>' +
                                        '<div class="bottom">' +
                                            '<div class="content">' +
                                                lang.translate('editor.templates.dominos.textfiller') +
                                            '</div>' +
                                        '</div>' +
                                    '</section>' +
                                '</div>' +
                                '<div class="item">' +
                                    '<section class="domino white">' +
                                        '<div class="top">' +
                                            '<img src="' + skinPath + 'image-default.svg" class="fixed twelve cell" />' +
                                        '</div>' +
                                            '<div class="bottom">' +
                                            '<div class="content">' +
                                                lang.translate('editor.templates.dominos.textfiller') +
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
        });

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
                        ui.extendElement.resizable(element.find('[contenteditable]').find('.image-container, table, .column'), {
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
                            editorInstance.addState(editZone.html());
                            
                            var parentContainer = range.startContainer;

                            if (
                                    (parentContainer.nodeType === 1 && parentContainer.nodeName === 'LI') ||
                                    (parentContainer.parentNode.nodeType === 1 && parentContainer.parentNode.nodeName === 'LI') ||
                                    (parentContainer.nodeType === 1 && parentContainer.nodeName === 'TD') ||
                                    (parentContainer.parentNode.nodeType === 1 && parentContainer.parentNode.nodeName === 'TD')
                                ) {
                                return;
                            }

                            var blockContainer = parentContainer;
                            while (blockContainer.nodeType !== 1 || textNodes.indexOf(blockContainer.nodeName) !== -1) {
                                blockContainer = blockContainer.parentNode;
                            }
                            if (parentContainer === editZone[0]) {
                                var wrapper = $('<div></div>');
                                $(editZone[0]).append(wrapper);
                                wrapper.html('&#8203;');
                                blockContainer = wrapper[0];
                                parentContainer = wrapper[0];
                            }
                            if (blockContainer === editZone[0]) {
                                var startOffset = range.startOffset;
                                var wrapper = $('<div></div>');
                                
                                while (editZone[0].childNodes.length) {
                                    $(wrapper).append(editZone[0].childNodes[0]);
                                }
                                $(blockContainer).append(wrapper);
                                blockContainer = wrapper[0];
                                var sel = document.getSelection();
                                var r = document.createRange();
                                r.setStart(parentContainer, startOffset);
                                sel.removeAllRanges();
                                sel.addRange(r);
                                range = r;
                            }
                            var newNodeName = 'div';
                            if ((parentContainer.nodeType === 1 && range.startOffset < parentContainer.childNodes.length)
                                || (parentContainer.nodeType === 3 && range.startOffset < parentContainer.textContent.length)) {
                                newNodeName = blockContainer.nodeName.toLowerCase();
                            }
                            var newLine = $('<' + newNodeName + '>&#8203;</' + newNodeName + '>');

                            blockContainer.parentNode.insertBefore(newLine[0], blockContainer.nextSibling);

                            newLine.attr('style', $(blockContainer).attr('style'));
                            newLine.attr('class', $(blockContainer).attr('class'));
                            
                            e.preventDefault();
                            var rangeStart = 1;
                            if(parentContainer.nodeType === 3){
                                var content = parentContainer.textContent.substring(range.startOffset, parentContainer.textContent.length);
                                if(!content){
                                    content = '&#8203;';
                                }
                                else {
                                    rangeStart = 0;
                                }
                                newLine.html(content);
                                parentContainer.textContent = parentContainer.textContent.substring(0, range.startOffset);
                            }
                            else{
                                while(parentContainer.childNodes.length > range.startOffset){
                                    newLine.append(parentContainer.childNodes[range.startOffset]);
                                }
                            }

                            var nodeCursor = parentContainer;
                            while (nodeCursor !== blockContainer) {
                                var cursorClone;
                                if (nodeCursor.nodeType === 1) {
                                    let nodeName = nodeCursor.nodeName.toLowerCase();
                                    if(nodeName === 'a'){
                                        nodeName = 'span';
                                    }
                                    cursorClone = document.createElement(nodeName);
                                    $(cursorClone).attr('style', $(nodeCursor).attr('style'));
                                    $(cursorClone).attr('class', $(nodeCursor).attr('class'));
                                    $(cursorClone).append(newLine[0].firstChild);
                                    newLine.prepend(cursorClone);
                                }
                                        
                                var sibling = nodeCursor.nextSibling;
                                while (sibling !== null) {
                                    //order matters here. appending sibling before getting nextsibling breaks the loop
                                    var currentSibling = sibling;
                                    sibling = sibling.nextSibling;
                                    newLine.append(currentSibling);
                                }

                                nodeCursor = nodeCursor.parentNode;
                            }

                            if (!(parentContainer as any).wholeText && parentContainer.nodeType === 3) {
                                // FF forces encode on textContent, this is a hack to get the actual entities codes,
                                // since innerHTML doesn't exist on text nodes
                                parentContainer.textContent = $('<div>&#8203;</div>')[0].textContent;
                            }

                            var range = document.createRange();
                            var newStartContainer = newLine[0];
                            while(newStartContainer.firstChild){
                                newStartContainer = newStartContainer.firstChild;
                            }
                            range.setStart(newStartContainer, rangeStart);

                            sel.removeAllRanges();
                            sel.addRange(range);
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

                    element.on('dragover', function(e){
                        element.addClass('droptarget');
                    });

                    element.on('dragleave', function(){
                        element.removeClass('droptarget');
                    });

                    element.find('[contenteditable]').on('drop', function (e) {
                        if(!e.originalEvent.dataTransfer){
                            return;
                        }
                        var visibility: 'protected' | 'public' = 'protected';
                        if (editorInstance.visibility === 'public') {
                            visibility = 'public';
                        }

                        element.removeClass('droptarget');
                        var el = {} as any;
                        var files = e.originalEvent.dataTransfer.files;
                        if(!files.length){
                            return;
                        }
                        e.preventDefault();
                        var range;
                        var sel = window.getSelection();
                        if (document.caretRangeFromPoint) {
                            range = document.caretRangeFromPoint(e.originalEvent.clientX, e.originalEvent.clientY);
                        }
                        else if (document.caretPositionFromPoint) {
                            var caretPosition = document.caretPositionFromPoint(e.originalEvent.clientX, e.originalEvent.clientY);
                            range = document.createRange();
                            range.setStart(caretPosition.offsetNode, caretPosition.offset);
                        }
                        if (range) {
                            sel.removeAllRanges();
                            sel.addRange(range);
                            editorInstance.selection.range = range;
                            editorInstance.selection.rangeCount = 1;
                        }

                        let html = '';
                        let all = files.length;

                        const uploadFile = async (file: File) => {
                            var name = files[i].name;
                            const doc = new Document();
                            await doc.upload(files[i], visibility)
                            all --;
                            var path = '/workspace/document/';
                            if (visibility === 'public') {
                                path = '/workspace/pub/document/';
                            }

                            if (name.indexOf('.mp3') !== -1 || name.indexOf('.wav') !== -1 || name.indexOf('.ogg') !== -1) {
                                el = $('<audio controls preload="none"></audio>');
                                el.attr('src', path + doc._id)
                            }
                            else if (name.toLowerCase().indexOf('.png') !== -1 || name.toLowerCase().indexOf('.jpg') !== -1 || name.toLowerCase().indexOf('.jpeg') !== -1 || name.toLowerCase().indexOf('.svg') !== -1) {
                                el = $('<img />');
                                el.attr('src', path + doc._id + '?thumbnail=150x150')
                            }
                            else {
                                el = $('<div class="download-attachments">' +
                                    '<h2>' + lang.translate('editor.attachment.title') + '</h2>' +
                                    '<div class="attachments">' +
                                        '<a href="'+ path + doc._id + '"><div class="download"></div>' + name + '</a>' +
                                '</div></div><div><br /><div><br /></div></div>');
                            }

                            html += '<div>' + el[0].outerHTML + '<div><br></div><div><br></div></div>';
                            if(all === 0){
                                editorInstance.selection.replaceHTML(html);
                            }
                        }

                        for(var i = 0; i < files.length; i++){
                            (function(){
                                uploadFile(files[i])
                            }())
                        }
                    });

                    scope.$on('$destroy', function () {
                        cancelAnimationFrame(placeEditorToolbar);
                    });
                }
            };
        }]);


        //Style directives
        module.directive('selectList', function(){
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    displayAs: '@',
                    placeholder: '@',
                    display: '='
                },
                template: '' +
                    '<div class="selected-value">[[showValue()]]</div>' +
                    '<div class="options hidden" ng-transclude></div>',
                link: function(scope, element, attributes){
                    scope.showValue = function(){
                        if(!scope.display){
                            return lang.translate(scope.placeholder);
                        }
                        if(!scope.displayAs){
                            return lang.translate(scope.display);
                        }
                        return lang.translate(scope.display[scope.displayAs]);
                    };

                    element.children('.options').on('mouseover', function (e){
                        e.stopPropagation()
                    });

                    element.children('.selected-value').on('click', function(){
                        if (element.children('.options').hasClass('hidden')) {
                            setTimeout(function () {
                                element.parent().css({ 'z-index': 9999 });
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
                            
                            element.children('.options').removeClass('hidden');
                            element.children('.options').height(element.children('.options')[0].scrollHeight);
                        }
                        else {
                            element.parent().css({ 'z-index': '' });
                            element.parents().css({ overflow: '' });
                            element.parents('editor-toolbar').each(function (index, item) {
                                $(item).css({ 'margin-top': '', 'min-height': '', height: '' })
                            });
                            element.children('.options').addClass('hidden');
                        }
                    });

                    $('body').click(function(e){
                        if (e.target === element.find('.selected-value')[0] ||
                            element.children('.options').hasClass('hidden')) {
                            return;
                        }

                        if (element.parents('lightbox').length === 0) {
                            element.parent().css({ 'z-index': '' });
                            element.parents().css({ overflow: '' });
                        }

                        element.parents('editor-toolbar').each(function (index, item) {
                            $(item).css({ 'margin-top': '', 'min-height': '', height: '' })
                        });

                        element.children('.options').addClass('hidden');
                    });
                }
            }
        });

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
