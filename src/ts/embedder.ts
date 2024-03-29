import http from "axios";
import { Element } from "./workspace/model";


export interface Embedder {
    "name": string,
    "displayName": string,
    "url": string[],
    "logo": string,
    "embed": string
    "example": string
}
type Visibility = "public" | "protected" | "external";
export const embedderService = {
    _providers: null as Embedder[],
    async    getProviders() {
        if (embedderService._providers != null) {
            return embedderService._providers;
        }
        const providers = (await http.get('/infra/embed/default')).data;
        const customProviders = (await http.get('/infra/embed/custom')).data;
        for (const custom of customProviders) {
            custom.name = (custom.name || "").toLowerCase().replace(/\ |\:|\?|#|%|\$|£|\^|\*|€|°|\(|\)|\[|\]|§|'|"|&|ç|ù|`|=|\+|<|@/g, '')
        }
        embedderService._providers = [...providers, ...customProviders];
        return embedderService._providers;
    },
    getHtmlForVideoStream(document:Element, visibility: Visibility){
        const m = document.metadata;
        const dataCaptation = (typeof m.captation!=="undefined") ? `data-document-is-captation="${m.captation}"` : "";
        const resolution = (typeof m.width==="number" && typeof m.height==="number") ? `${m.width}x${m.height}` : null;
        const dataResolution = (resolution) ? `data-video-resolution="${resolution}"` : "";
        const documentUrl = `/workspace${visibility == "public" ? "/pub" : ""}/document/${document._id}`
        return `<span contenteditable="false" class="image-container">
            &#8203;<video playsinline="true" controls controlsList="nodownload" class="render" src="${documentUrl}" data-document-id="${document._id}" ${dataCaptation} ${dataResolution}></video>
            </span>&nbsp;&nbsp;`
    },
    getHtmlForVideoStreams(documents:Element[], visibility: Visibility){
        return documents.map(d=>embedderService.getHtmlForVideoStream(d, visibility)).join(' ');
    },
    async getHtmlForUrl(url: string, returnDefault: boolean = false) {
        if(url && url.trim().startsWith('<iframe')) return url;
        const providers = await embedderService.getProviders();
        for (const p of providers) {
            const html = embedderService.getHtmlForProvider(p, url);
            if(html && html.length > 0){
                return html;
            }
        }
        if(returnDefault){
            return `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`
        }
        return "";
    },
    getHtmlForProvider(embedder: Embedder, url: string): string {
        for (let pattern of embedder.url) {
            const matchParams = new RegExp('\{[a-zA-Z0-9_.]+\}', "g");
            const params = pattern.match(matchParams) || [];
            const computedEmbed = embedder.embed;

            params.splice(1, params.length);
            for (const param of params) {
                let paramBefore = pattern.split(param)[0];
                const additionnalSplit = paramBefore.split('}')
                if (additionnalSplit.length > 1) {
                    paramBefore = additionnalSplit[additionnalSplit.length - 1];
                }
                let paramValue = url.split(paramBefore)[1];
                if (!paramValue) {
                    continue;
                }
                const paramAfter = pattern.split(param)[1].split('{')[0];
                if (paramAfter) {
                    paramValue = paramValue.split(paramAfter)[0];
                }

                const replace = new RegExp('\\' + param.replace(/}/, '\\}'), 'g');
                return computedEmbed.replace(replace, paramValue);
            };
        }
        return "";
    }
}

if (!window.entcore) {
    window.entcore = {};
}
window.entcore.embedderService = embedderService;