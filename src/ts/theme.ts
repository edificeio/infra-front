import { skin } from "./skin";
import { ui } from "./ui";

declare var jQuery:any;

export const themeService = {
    loadOldWrappedTheme(oldTheme:string, skinName:string){
        let version = 'dev';
        if((window as any).springboardBuildDate){
            version = (window as any).springboardBuildDate;
        }
        jQuery("#themeOld").remove();
        const style = jQuery('<link>', {
            rel: 'stylesheet',
            type: 'text/css',
            href: (window as any).CDN_DOMAIN+`/assets/themes/${oldTheme}/skins/${skinName}/wrapped.theme.css?version=${version}`,
            id: 'themeOld'
        }).attr("crossorigin", "anonymous");
        jQuery('head').append(style);
    },
    loadThemeJs(theme:string){
        let version = 'dev';
        if((window as any).springboardBuildDate){
            version = (window as any).springboardBuildDate;
        }
        jQuery("#themeJS").remove();
        const style = jQuery('<script>', {
            type: 'text/javascript',
            src: (window as any).CDN_DOMAIN+`/assets/themes/${theme}/js/theme.js?version=${version}`,
            id: 'themeJS'
        });
        jQuery('body').append(style);
    },
    async initThemeLegacy(){
        const conf = await ui.getConf();
        await skin.onSkinReady;
        const themeName = skin.themeName;
        const skinName = skin.skinName;
        let url = skin.theme;
        for(let theme of conf.overriding){
            const legacy = theme.legacyVersion || theme.parent;
            if(theme.child==themeName && legacy){
                url = (window as any).CDN_DOMAIN + `/assets/themes/${legacy}/skins/${skinName}/`;
                $("html").addClass(legacy);
                themeService.loadThemeJs(legacy);
                skin.theme = `/assets/themes/${legacy}/skins/${skinName}/`;
            }
        }
        ui.setStyle(url);
    },
    async initDisconnectedLegacyTheme() {
        const conf = await ui.getCurrentThemeConf();
        await skin.onSkinReady;
        const currentTheme = conf;
        const skinName = 'default';
        let url = skin.theme;
        const legacy = currentTheme.parent;
        url = (window as any).CDN_DOMAIN + `/assets/themes/${legacy}/skins/${skinName}/`;
        $("html").addClass(legacy);
        themeService.loadThemeJs(legacy);
        skin.theme = `/assets/themes/${legacy}/skins/${skinName}/`;
        ui.setStyle(url);
    }
}

function loadLegacyTheme(url, legacy, skinName) {
    url = (window as any).CDN_DOMAIN + `/assets/themes/${legacy}/skins/${skinName}/`;
    $("html").addClass(legacy);
    themeService.loadThemeJs(legacy);
    skin.theme = `/assets/themes/${legacy}/skins/${skinName}/`;
}

export function initThemeDirective(module:any){
    module.directive('withTheme', function(){
        return {
            restrict: 'EA',
            link: async function(scope, element, attributes){
                const conf = await ui.getConf();
                await skin.onSkinReady;
                const themeName = skin.themeName;
                const skinName = skin.skinName;
                let url = skin.theme;
                for(let theme of conf.overriding){
                    //replace theme by bootstrap version
                    if(theme.child==themeName && theme.bootstrapVersion){
                        url = (window as any).CDN_DOMAIN + `/assets/themes/${theme.bootstrapVersion}/skins/${skinName}/`;
                        element.addClass(theme.bootstrapVersion);//add class at root=>wrapped theme
                        // themeService.loadOldWrappedTheme(theme.child, skinName);
                        themeService.loadThemeJs(theme.bootstrapVersion)
                    }
                }
                ui.setStyle(url);
            }
        }
    });
}