import { appPrefix, Behaviours, model } from './entcore';

export interface Shareable {
    shared: any;
    owner: { userId: string, displayName: string };
    myRights: any;
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

            model.on('bootstrap', () => {
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