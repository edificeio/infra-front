import { appPrefix, Behaviours, model } from './entcore';

export interface Shareable {
    shared: any;
    owner: { userId: string, displayName: string };
    myRights: Map<string, boolean>;
}

let waitingFor = {};

export class Rights<T extends Shareable> {
    constructor(private resource: T) {
        this.myRights = new Map<string, boolean>();
    }

    myRights: Map<string, boolean>;

    isOwner() {
        return this.resource.owner.userId === model.me.userId;
    }

    fromBehaviours(prefix?: string): Promise<any> {
        if (!prefix) {
            prefix = appPrefix;
        }

        return new Promise((resolve, reject) => {
            if (Behaviours[prefix]) {
                resolve(this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix));
            }
            else {
                if (waitingFor[prefix]) {
                    waitingFor[prefix].push(() => resolve());
                }
                else {
                    waitingFor[prefix] = [];
                    Behaviours.loadBehaviours(prefix, () => {
                        resolve(this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix));
                        waitingFor[prefix].forEach((f) => f());
                        delete waitingFor[prefix];
                    });
                }
            }
        });
    }

    fromObject(obj: any, prefix: string): any {
        let resourceRights = obj.resource;
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
    }
}

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.Rights = Rights;