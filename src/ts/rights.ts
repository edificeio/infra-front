import { appPrefix, Behaviours, model } from './entcore';

export interface Shareable {
    shared: any;
    owner: { userId: string, displayName: string };
    myRights: any;
}


export interface ShareVisible {
    id: string, name: string,
    groupDisplayName?: string,
    structureName?: string
    actions?: any
}
export interface ShareAction {
    name: string[], displayName: string, type: string
    priority?: number
    requires?: any
}
export interface ShareInfosDetail {
    checked: { [key: string]: string[] }
    checkedInherited: { [key: string]: string[] }
    visibles: ShareVisible[]
}
export interface ShareInfos {
    actions: ShareAction[]
    groups: ShareInfosDetail
    users: ShareInfosDetail
}
export interface SharePayload {
    groups?: { [key: string]: string[] }
    bookmarks?: { [key: string]: string[] }
    users?: { [key: string]: string[] }
}

let waitingFor = {};

export class Rights<T extends Shareable> {
    constructor(private resource: T) {
        this.myRights = {};
    }

    myRights: any;

    isOwner() {
        return this.resource.owner.userId === model.me.userId;
    }

    fromBehaviours(prefix?: string): Promise<any> {
        if (!prefix) {
            prefix = appPrefix;
        }

        return new Promise((resolve, reject) => {
            if (Behaviours.applicationsBehaviours[prefix] && !Behaviours.applicationsBehaviours[prefix].callbacks) {
                this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix).then((result) => {
                     resolve(result);
                });
               
            }
            else {
                if (waitingFor[prefix]) {
                    waitingFor[prefix].push(() => resolve(this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix)));
                }
                else {
                    waitingFor[prefix] = [];
                    Behaviours.loadBehaviours(prefix, () => {
                        this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix).then((result) => {
                            resolve(result);
                            waitingFor[prefix].forEach((f) => f());
                            delete waitingFor[prefix];
                        });
                    });
                }
            }
        });
    }

    async fromObject(obj: any, prefix: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let resourceRights = obj.resource;

            let computeRights = () => {
                for (var behaviour in resourceRights) {
                    if (
                        model.me && (
                            model.me.hasRight(this.resource, resourceRights[behaviour]) ||
                            (
                                this.resource.owner && (model.me.userId === this.resource.owner.userId)
                            )
                        )
                    ) {
                        this.myRights[behaviour] = true;
                    }
                }
            };

            if (model.me) {
                computeRights();
                resolve();
                return;
            }

            if(model.bootstrapped && !model.me){
                resolve();
                return;
            }

            model.one('bootstrap', () => {
                computeRights();
                resolve();
            });
        });
    }
}

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.Rights = Rights;