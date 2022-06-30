import {Document} from "../../workspace";
import {FolderTreeProps} from "../folderTree";

export interface IVirtualMediaLibraryScope {

    /**
     * document folder type
     */
    folders: Array<Document>;

    /**
     * any documents
     */
    documents: Array<Document>;

    /**
     * the current opened tree loaded from behaviours
     */
    openedTree: FolderTreeProps;

    /**
     * While initializing the service tree, this method will be implemented to any behaviours in order to enable the mediaLibraryService
     * @returns {boolean}
     */
    enableInitFolderTree(): boolean;

    /**
     * Init the folder tree service behaviour's ideal
     * **IMPORTANT**: Requires this method to populate {folders} and {documents} members
     */
    initFolderTree(): Promise<void>;

    /**
     * Open the folder (via tree or in the content view)
     * **IMPORTANT**: Requires this method to populate {folders} children and {documents} children members
     */
    openFolder(folder: Document): Promise<void>;


    /**
     * This method will execute the behaviour's action before its executes the media library scope {selectDocuments()}
     *
     * @returns {Array<Document>} where all elements will be selected and assigned to media library's {documents} scope
     * before executing media library scope {selectDocuments()}
     *
     * @example
     * in one module's behaviour, we implement onSelectVirtualDocumentsBefore() on which we call an API service to duplicate the document and return
     * the wished documents to be assigned
     *
     * Another example would be to call an API or any other method
     * in the end, this shall return a "truth" document with truth id to be interacted for the {selectDocuments()}
     *
     * @param documents selected documents used to "materialize" into documents
     */
    onSelectVirtualDocumentsBefore(documents: Array<any>): Promise<Array<Document>>;

    /**
     * (optional) Allows clear copied documents (if you decided in your method {onSelectVirtualDocumentsBefore()})
     * to duplicate your selected document or entities and returns new documents within
     *
     * @param documents selected documents
     */
    clearCopiedDocumentsAfterSelect(documents: Array<Document>): Promise<void>;
}