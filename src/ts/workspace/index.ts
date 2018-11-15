import * as workspace1 from "./workspace-v1";
import * as wmodels from "./model";
import * as wservices from "./services";
/**
 * exports
 */
export * from "./workspace-v1"; 
export namespace workspace.v2 {
    export import service = wservices.workspaceService;
    export import ElementQuery = wservices.ElementQuery;
    export import WorkspaceEvent = wservices.WorkspaceEvent;
    export import WorkspacePreference = wservices.WorkspacePreference;
    export import WorkspacePreferenceView = wservices.WorkspacePreferenceView;
    export import models = wmodels;
};
/**
 * browser
 */
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.Folder = workspace1.Folder;
window.entcore.quota = workspace1.quota;
window.entcore.Document = workspace1.Document;
window.entcore.MediaLibrary = workspace1.MediaLibrary;
window.entcore.DocumentStatus = workspace1.DocumentStatus;
window.entcore.workspace = workspace;