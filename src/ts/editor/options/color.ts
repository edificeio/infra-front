import { $ } from '../../libs/jquery/jquery';
import { http } from "../../http";

function rgb(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
var rgba = rgb;
var transparent = 'rgba(255, 255, 255, 0)';

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

export const color = {
    name: 'color', 
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.color"></i>' +
                '<input tooltip="editor.option.color" type="color" tabindex="-1"/>',
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
                    applyColor();
                });

                element.get(0).addEventListener('click', () => {
                    scope.foreColor = element.children('input').val();
                    scope.$apply('foreColor');
                    applyColor();
                }, true);

                function applyColor () {
                    instance.selection.css({'color': scope.foreColor});
                }
            }
        };
    }
};

export const backgroundColor = {
    name: 'backgroundColor',
    run: function(instance){
        return {
            template: '<i></i><input tooltip="editor.option.backgroundcolor" type="color" tabindex="-1" />',
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
                    applyBackgroundColor();
                });
                element.get(0).addEventListener('click', () => {
                    scope.backColor = element.children('input').val();
                    scope.$apply('backColor');
                    applyBackgroundColor();
                }, true);

                function applyBackgroundColor() {
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
                    instance.selection.css({'background-color': scope.backColor});
                }
            }
        };
    }
};