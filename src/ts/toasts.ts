import {idiom as lang} from "./idiom";
import {$} from "./entcore";

/**
 * @description a pop-up on the right screen to display infos or more
 * @param text :message which will be displayed
 */
export const toasts =  {
    message: function(status, text){
        let HasDivToasts=$(".toasts")[0];
        if(!HasDivToasts){
            $("body").append('<div class="toasts"></div>');
        }
        text = lang.translate(text);
        let toastsContainer = $('.toasts')[0];
        let toastTemplate = `
        <div class="show vertical-spacing horizontal-spacing ${status} toast-content">
            <div class="content">
                ${text}
            </div>
            <div class="timer animate"></div>
        </div>
    `;
    let toastTemplateJquery = $(toastTemplate);
    let toast = toastTemplateJquery.appendTo(toastsContainer);
    setTimeout(() =>  $(toastTemplateJquery).find( ".timer" ).addClass("animation"), 100);
    setTimeout(() => toast.remove(), 3100);
    },
    warning: function(text){
        this.message('warning', text);
    },
    info: function(text){
        this.message('info', text);
    },
    confirm: function(text){
        this.message('confirm', text);
    }
};

if(!(window as any).entcore){
    (window as any).entcore = {};
}
(window as any).entcore.toasts = toasts;
(window as any).toasts = toasts;