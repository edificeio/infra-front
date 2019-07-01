import axios from 'axios';
import { ui } from '../ui';
import { Element, ROLES, FOLDER_TYPE } from "../workspace/model";
import { Document } from "../workspace/workspace-v1";
import { workspaceService } from '../workspace/services';
import { model } from '../modelDefinitions';
import { MD5 } from "./utils";
import { Me } from '../me';

const EXTERNAL_ID = "edumedia";
const CONTENT_TYPE = "edumedia";
declare var jQuery: any;
declare var window: Window;
declare var $: any;
export interface EdumediaConfig {
    uri: string
    pattern: string
}
export interface EdumediaMedia {
    id: string
    title: string
    type: "simulation" | "video" | "doc_pack"
    computedType: "simulation" | "video" | "quiz" | "doc_pack"
    width: number
    height: number
    wide: boolean
    href: string
    apiURL: string
    thumbnail: string
    leaf: boolean
    media: boolean
}
export interface EdumediaMediaDetails extends EdumediaMedia {
    frameURL: string
}
export interface EdumediaSearchResult {
    href: "string"
    q: "string"
    medias: EdumediaMedia[]
}
export interface EdumediaTree {
    id: string
    title: string
    type: "root" | "node" | "curriculum"
    leaf: boolean
    href: string
    parentID: string
    //leaf has media else it has children
    children?: EdumediaTreeItem[]
    medias?: EdumediaMedia[]
}
export interface EdumediaTreeItem {
    id: string
    title: string
    href: string
    apiURL: string
    leaf: boolean
}
export const EDU_MEDIA_CONTENT_TYPE = "edumedia/html";
const EDU_MEDIA_DEFAULT_URL = "https://www.edumedia-sciences.com";
let _token: string;
let _tokenPromise: Promise<string>;
export const edumediaService = {
    cacheBaseUrl: null,
    cacheConfig: null,
    async isEdumediaEnabled() {
        await Me.onSessionReady();
        const conf = await edumediaService.getEdumediaConfig();
        const hasEdumedia = model.me && (model.me.optionEnabled || []).indexOf("EDUMEDIA") > -1;
        return !!conf && hasEdumedia;
    },
    async getEdumediaConfig(): Promise<EdumediaConfig> {
        if (edumediaService.cacheConfig != null) {
            return edumediaService.cacheConfig;
        }
        const conf = await ui.getCurrentThemeConf();
        if (!conf || !conf.edumedia) {
            console.warn("Edumedia not configured in theme-conf.js or in current theme", conf);
            return null;
        }
        edumediaService.cacheConfig = conf.edumedia;
        return conf.edumedia;
    },
    async fetchHtml(element: Element) {
        const a = await workspaceService.getDocumentBlob(element._id);
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = function () {
                resolve(reader.result);
            }
            reader.readAsText(a);
        });
    },
    hasEdumediaContentType(element: Element) {
        return element.contentType.indexOf(EDU_MEDIA_CONTENT_TYPE) > -1;
    },
    getUrl(): Promise<string> {
        const inner = async () => {
            if (!edumediaService.cacheBaseUrl) {
                const conf = await edumediaService.getEdumediaConfig();
                edumediaService.cacheBaseUrl = conf.uri;
                if (!edumediaService.cacheBaseUrl) {

                    edumediaService.cacheBaseUrl = EDU_MEDIA_DEFAULT_URL;
                }
            }
            return `${edumediaService.cacheBaseUrl}/${window.entcore.currentLanguage}/api/v1`
        }
        return inner();
    },
    getToken(): Promise<string> {
        if (_tokenPromise != undefined) {
            return _tokenPromise;
        }
        /*const promiseFactory = async () => {
            try {
                const res = await axios.get("/auth/external/token/edumedia");
                if (res.status == 200) {
                    _token = res.data.token;
                } else {
                    _token = null;
                }
            } catch (e) {
                _token = null;
            }
            return _token;
        }*/
        const promiseFactory = async () => {
            _token = null;
            //
            const conf = await edumediaService.getEdumediaConfig();
            const URI: string = conf.uri;
            const HASH_PATTERN: string = conf.pattern;
            // fetch token from edumedia
            const fetch = async (uai: string): Promise<string> => {
                const hash = MD5(HASH_PATTERN.replace("[[uai]]", uai));
                const params = new URLSearchParams();
                params.append('uai', uai);
                params.append('hash', hash);
                const res = await axios.post(`${URI}/api/one/uai-token`, params, {
                    headers: {
                        "accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
                if (res.status == 200 && res.data.success) {
                    return res.data.token;
                } else {
                    console.warn("[Edumedia] fetch of token failed for uai failed: ", res.status, res.data, uai)
                    return null;
                }
            }
            // check for each uai
            const promises: Array<Promise<any>> = []
            for (let uai of model.me.uai) {
                promises.push(fetch(uai))
            }
            const result = await Promise.all(promises);
            for (let res of result) {
                if (res != null) {
                    _token = res;
                }
            }
            return _token;
        };
        _tokenPromise = promiseFactory();
        return _tokenPromise;
    },
    async search(search: string, max?: number): Promise<EdumediaSearchResult> {
        const url = await edumediaService.getUrl();
        const res = await axios({
            url: `${url}/search?q=${search}&max=${max}`,
            method: 'get'
        });
        return res.data;
    },
    async fetchSubjects(): Promise<EdumediaTree> {
        const url = await edumediaService.getUrl();
        const res = await axios({
            url: `${url}/tree-item/n-root`,
            method: 'get'
        });
        return res.data;
    },
    async fetchChildren(item: EdumediaTreeItem): Promise<EdumediaTree> {
        const res = await axios({
            url: item.apiURL,
            method: 'get'
        }) as any;
        const data: EdumediaTree = res.data;
        if (data.medias) {
            data.medias.forEach(m => m.media = true)
        }
        return data;
    },
    async fetchMediaDetail(media: EdumediaMedia): Promise<EdumediaMediaDetails> {
        const token = await edumediaService.getToken();
        const res = await axios({
            url: `${media.apiURL}?token=${token}`,
            method: 'get'
        });
        return res.data;
    },
    getContentTypeFor(media: EdumediaMediaDetails | EdumediaMedia) {
        //back does not respect content type param? ';'
        return `${EDU_MEDIA_CONTENT_TYPE}$id=${media.id}`;
    },
    getIdFromContentType(contentType: string) {
        const idPart = contentType.split("$").find((val) => val.startsWith("id="));
        return idPart && idPart.replace("id=", "").replace("$", "");
    },
    getThumbFromContentType(contentType: string) {
        const id = edumediaService.getIdFromContentType(contentType);
        return id && `${EDU_MEDIA_DEFAULT_URL}/media/thumbnail/${id}`;
    },
    toHtml(media: EdumediaMediaDetails) {
        return `
            <div style="position:relative">
                <iframe id="edumedia_${media.id}" title="${media.title}" width="${media.width}" height="${media.height}" src="${media.frameURL}">
                </iframe>  
                <h6 edumedia-fullscreen-jquery="edumedia_${media.id}">Afficher en plein écran</h6>
            </div>  
        `
    },
    async saveIntoWorkspace(media: EdumediaMediaDetails) {
        const html = edumediaService.toHtml(media);
        const type = edumediaService.getContentTypeFor(media);
        const file = new File([html], `${media.title}`, { type });
        const doc = new Document;
        return workspaceService.createExternalDocument(file, doc, EXTERNAL_ID, {
            visibility: "protected",
            application: EXTERNAL_ID
        })
    },
    closeFullScreen() {
        jQuery("#edumedia-fullscreen-lightbox").remove();
    },
    makeFullscreen: (id) => {
        jQuery("#edumedia-fullscreen-lightbox").remove();
        jQuery("body").append(`
        <section class="lightbox" id="edumedia-fullscreen-lightbox">
            <div class="background"></div>
            <div class="edumedia-fullscreen-content"></div>
            <div class="close-lightbox" onclick="document.querySelectorAll('#edumedia-fullscreen-lightbox').forEach(function(e){ e.remove(e)})">
                    <i class="close-2x"></i>
                </div>
        </section>
        `);
        const copy = jQuery("#" + id).clone();
        copy.removeAttr("id")
        const viewportWidth = $(window).width() - 100;
        const viewportHeight = $(window).height() - 100;//make close button visible
        copy.attr("width", viewportWidth)
        copy.attr("height", viewportHeight)
        jQuery(".edumedia-fullscreen-content").append(copy);
    }
}
// === Register thumb mapper and role mapper
function initWorkspaceConfig() {
    Element.registerContentTypeToRoleMapper((contentType, preview) => {
        if (contentType.indexOf(EDU_MEDIA_CONTENT_TYPE) > -1) {
            if (preview) {
                return ROLES.HTML;
            }
            return ROLES.IMG;
        }
    });
    Element.registerThumbUrlMapper((element) => {
        if (element.contentType.indexOf(EDU_MEDIA_CONTENT_TYPE) > -1) {
            const url = edumediaService.getThumbFromContentType(element.contentType);
            return url;
        }
    });
    //if edumedia is enabled=> add edumedia folder
    const initFolder = async () => {
        const isEnabled = await edumediaService.isEdumediaEnabled();
        if (isEnabled) {
            const conf = await edumediaService.getEdumediaConfig();
            edumediaService.cacheBaseUrl = conf.uri;
            return { externalId: EXTERNAL_ID, name: "Edumedia" };
        }
        return null;
    }
    workspaceService.addExternalFolder(initFolder());
    //register fullscreen renderer
    workspaceService.registerExternalFullScreenRenderer((element) => {
        if (element.contentType.indexOf(EDU_MEDIA_CONTENT_TYPE) > -1) {
            const mediaId = edumediaService.getIdFromContentType(element.contentType);
            edumediaService.makeFullscreen(`edumedia_${mediaId}`);
            return {
                close() {
                    edumediaService.closeFullScreen();
                }
            }
        }
        return false;
    })
    //register action type filter
    workspaceService.registerExternalActionFilter((element, type) => {
        if (element.contentType.indexOf(EDU_MEDIA_CONTENT_TYPE) > -1) {
            switch (type) {
                case "comment":
                case "copy":
                case "download":
                case "history":
                case "move":
                case "share":
                    return false;
            }
        }
        return true;
    })
}
initWorkspaceConfig();