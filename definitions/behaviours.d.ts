export declare var Behaviours: {
    copyRights: (params: any) => void;
    register: (application: any, appBehaviours: any) => void;
    findRights: (serviceName: any, resource: any) => any;
    findBehaviours: (serviceName: any, resource: any) => void;
    loadBehaviours: (serviceName: any, callback: any) => {
        error: (cb: any) => void;
    };
    findWorkflow: (serviceName: any) => any;
    workflowsFrom: (obj: any, dependencies: any) => {};
    applicationsBehaviours: any;
};
