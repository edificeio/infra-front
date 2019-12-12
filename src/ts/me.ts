import { model } from './modelDefinitions';
import http from 'axios';
import { Eventer } from 'entcore-toolkit';
import { idiom } from './idiom';
import { $ } from "./entcore";
import { notify } from './notify';

export class Me{
    static preferences: any;
    static loading: any[] = [];
    private static eventer: Eventer = new Eventer();

    static get session(){
        return model.me;
    }

    static async savePreference(app: string): Promise<void>{
        await http.put('/userbook/preference/' + app, this.preferences[app]);
    }

    static async preference(app: string): Promise<any>{
        if(!this.preferences){
            this.preferences = {};
        }

        return new Promise<any>((resolve, reject) => {
            if(!this.preferences[app] && this.loading.indexOf(app) === -1){
                this.loading.push(app);
                this.eventer.once(app + '-loaded', () => resolve(this.preferences[app]));

                http.get('/userbook/preference/' + app).then(response => {
                    let data = {};
                    if(response.data.preference){
                        try{
                            data = JSON.parse(response.data.preference);
                        }
                        catch(e){
                            data = {};
                        }
                    }
                    if(!data){
                        data = {};
                    }
                    this.preferences[app] = data;

                    this.eventer.trigger(app + '-loaded', this.preferences[app]);
                });
            }
            else if(!this.preferences[app]){
                this.eventer.once(app + '-loaded', () => resolve(this.preferences[app]));
            }
            else{
                resolve(this.preferences[app]);
            }
        });
    }
    static async revalidateTerms() {
        try {
            await http.put("/auth/cgu/revalidate");
            Me.session.needRevalidateTerms = false;
        } catch (e) {
            notify.error(idiom.translate("cgu.revalidate.failed"))
        }
    }
    static shouldRevalidate() {
        return new Promise((resolve, reject) => {
            if (model.me && model.me.userId) {
                resolve(Me.session.needRevalidateTerms);
            } else {
                model.one("userinfo-loaded", _ => {
                    resolve(Me.session.needRevalidateTerms);
                })
            }
        })
    }
    static onSessionReady(){
        return new Promise((resolve, reject) => {
            if (model.me && model.me.userId) {
                resolve(model.me);
            } else {
                //wait for model to be built?
                setTimeout(()=>{
                    model.one("userinfo-loaded", _ => {
                        resolve(model.me);
                    })
                })
            }
        })
    }
}

if(!(window as any).entcore){
	(window as any).entcore = {};
}
(window as any).entcore.Me = Me;
(window as any).newLogin = false;

// listen to storage event
window.addEventListener('storage', function(event){
    if (event.key == 'login-event') {
        if (event.newValue != null && model.me.login !== event.newValue ) {
            (window as any).newLogin = true;
            console.log("login-event");
        }
        localStorage.removeItem(event.key);
    }
}, false);

if(!(XMLHttpRequest.prototype as any).baseSend && !(window as any).pupetterMode){
    (XMLHttpRequest.prototype as any).baseSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data){
        if((document.cookie.indexOf('authenticated=true') === -1 || window['newLogin'] === true) && window.location.href.indexOf('/auth') === -1 && !window.notLoggedIn){
            const url = idiom.translate('disconnected.redirect.url');
            const checkedUrl = 'disconnected.redirect.url' != url && !!url && url.length > 0 ? url : '/auth/login';
            const lightbox = $(`<lightbox>
                    <section class="lightbox">
                        <div class="content">
                            <h2>${ idiom.translate('disconnected.title') }</h2>
                            <div class="warning">${ idiom.translate('disconnected.warning') }</div>
                            <a class="button right-magnet" href="${checkedUrl}">${ idiom.translate('disconnected.redirect') }</a>
                        </div>
                        <div class="background"></div>
                    </section>
                </lightbox>
            `);
            $('body').append(lightbox).addClass('lightbox-opened');
            lightbox.find('.lightbox').fadeIn();
            return;
        }
        (this as any).baseSend(data);
    }
}
