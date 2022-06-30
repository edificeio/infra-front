## Virtual Folder

Virtual Folder is an extension of Media-Library component in order to create your own virtual documents 
if you wish to make it exportable to all apps.

Each Virtual Folder must be implemented by an App using Behaviours.

### 1. Requirement

Must add public configuration to Workspace App :
<pre>
## Workspace configuration
{
      ...
      "config": {
         ...
         "publicConf": {
           "folder-service": ["appName", "appName2", ...]
        }
      }
}
</pre>

Note : `appName` (`or appName2`) must be written correctly in order to load their behaviours (e.g `Behaviours.load(appName)`)


## Implementation usage as an App

In your behaviours, you must add a field named `mediaLibraryService` (could be an object/class)

It should be accessible via `Behaviours.applicationsBehaviours[appName].mediaLibraryService`

`mediaLibraryService` must implement `VirtualMediaLibraryScope` as an object or class


### 1. Interface 

This is the interface that each app must implement :
```
interface IVirtualMediaLibraryScope{
    folders: Array<Document>;

    documents: Array<Document>;

    openedTree: FolderTreeProps;

    enableInitFolderTree(): boolean;

    initFolderTree(): Promise<void>;

    openFolder(folder: Document): Promise<void>;

    onSelectVirtualDocumentsBefore(documents: Array<any>): Promise<Array<Document>>;
 
    clearCopiedDocumentsAfterSelect(documents: Array<Document>): Promise<void>;
}
```
### 2. Interface Description

Each app must implement these scopes in their own behaviours as `mediaLibraryservice` (using `object` or `class` typescript)


| Scope                   | Type | Description - Ideal implementation                                                                      
| ------------------------- | ----- | -----------------------------------------------------------------------------------
| `folders`           | ` Array<Document>` | An Array of documents that must contain folder type
| `documents`       | `Array<Document>` | An Array of documents that must contain simply documents type                    
| `openedTree`       | `FolderTreeProps` | The current opened tree loaded from behaviours (will store your current behaviours media library service)                      
| `enableInitFolderTree`    | `boolean` | Method that will allow your virtual folder to be displayed as a `tree` service in media-library            
| `initFolderTree` | `Promise<void>` | Initialize your folder `tree` service (using `folder-tree` directive). this method **requires** `folders` and `documents` members to be populated
| `openFolder` | `Promise<void>` | open folder children from your `tree` service.  this method **requires** `folders` and `documents` members to be populated                      
| `onSelectVirtualDocumentsBefore` | `Promise<Array<Document>>` | This method will execute the behaviour's action before its executes the media library scope `selectDocuments()`.            
| `clearCopiedDocumentsAfterSelect` | `Promise<void>` | Allows clear copied documents (if you decided in your method `onSelectVirtualDocumentsBefore()`)                  

### 3. Interface Implementation example

```
Behaviours.register(appName, {
    right {
        ...
    }
    mediaLibraryService: new MediaLibraryService(), // mediaLibraryService
    ...
})
```

Creation object :
```
export const mediaLibraryService: IVirtualMediaLibraryScope = {
   // implements all methods
};
```
or class : 
```
export class MediaLibraryService implements VirtualMediaLibraryScope {
   // implements all methods
};
```

### 4. Example implementation for each method

Say we are implementing `MediaLibraryService` from a specific module that needs to display its own tree to the media library

```typescript
export class MediaLibraryService implements IVirtualMediaLibraryScope {
    openedTree: any;
    folders: Array<Document>;
    documents: Array<Document>;

    constructor() {
        this.folders = [];
        this.documents = [];
    }

    enableInitFolderTree(): boolean {
        return true // or anything, you make your own condition to determine whether it should be displayed in your virtual folder tree
    }

    async initFolderTree(): Promise<void> {
        // apicall() or method() from your own that will fetch data and use for assigning your folders and this documents
        // (e.g): 
        let documents: any = apiCall();

        // populate folder content to media library behaviours
        this.folders = documents.filter(filterFoldersOnly());
        
        // populate file content to media library behaviours
        this.documents = documents.filter(filterDocumentsOnly()); // See below the example of field Document object must have 
    }

    async openFolder(folder: models.Element): Promise<void> {
        // apicall() or method() from your own that will fetch data and use for assigning your folders and this documents
        // you can add extra business logic, it will depend what you seek for
        // (e.g): 
        let documents: any = anotherCall();

        // populate folder content to media library behaviours
        this.folders = documents.filter(filterFoldersOnly());

        // populate file content to media library behaviours
        this.documents = documents.filter(filterDocumentsOnly()); // See below the example of field Document object must have 
    }

    async onSelectVirtualDocumentsBefore(documents: Array<any>): Promise<Array<Document>> {
        // apicall() or method() from your own that will do any action you like
        // IMPORTANT this must return {Promise<Array<Document>>} containing a "real" document since this will be used for media library ng model
        
        let resDocuments = await anotherCall(documents); // could be calling your own API/method to duplicate or choose different documents
        return resDocuments;
        
    }

    async clearCopiedDocumentsAfterSelect(documents: Array<Document>): Promise<void> {
        if (documents && documents.length)
            service.deleteAll(documents); // SUGGESTED method that will clear any documents
        // note: service.deleteAll comes from workspaceService
    }

}
```

As for the `Document` model, these fields should be available :
```
{
    name: {string}
    comments: {string},
    metadata: {
        'content-type': {string},
        role: {string},
        extension: {string},
        filename: {string},
        size: {number}
    }, // metadata as the workspace object
    owner: {string},
    ownerName: {string}
}
```
Example fictive data of a document
```
{
   "_id": {string} (e.g "id"),
   "name": {string} (e.g "name"),
   "title": {string} (e.g "title"),
   "created": {string} (e.g "2022-06-02T12:06:00.000Z"),
   "children": {Array<this} file/folder content (recommanded to avoid TypeError)
   "documents": {Array<this>} file content 
   "folders": {Array<this>} folder content // not mandatory if you decide to lazy load your current folder
   "eParent": {string},
   "eType": {string}, "file" | "folder"
   "metadata":{
      "name": {string} (e.g "insert title"),
      "filename": {string}, (e.g "insert title.png"),
      "content-type": {string} (e.g "image/png"),
      "charset": {string} (e.g "UTF-8"),
      "size": {number} (e.g 77287),
      "extension": {string} (e.g "png"),
      "role": {string}, (e.g "img")
   },
   "version": {number} (e.g 50),
   "link": {string} (e.g "/workspace/document/id"),
   "icon":" {string} (e.g "/workspace/document/id"),
   "owner":{
      "userId": {string} (e.g "user id"),
      "displayName": {string} (e.g "display name")
   },
   "shared":[]
}
```


