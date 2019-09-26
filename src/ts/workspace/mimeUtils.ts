export class MimeTypeUtils {
    static INSTANCE = new MimeTypeUtils();
    private wordExtensions = new Set<string>();
    private excelExtensions = new Set<string>();
    private pptExtensions = new Set<string>();
    private fileExtensionMap = new Map<string, string>();
    public PDF = "application/pdf";

    constructor() {
        //word extensions
        this.wordExtensions.add("doc");
        this.wordExtensions.add("dot");
        this.wordExtensions.add("docx");
        this.wordExtensions.add("dotx");
        this.wordExtensions.add("docm");
        this.wordExtensions.add("dotm");
        this.wordExtensions.add("odt");
        this.wordExtensions.add("ott");
        this.wordExtensions.add("oth");
        this.wordExtensions.add("odm");
        //excel extensions
        this.excelExtensions.add("xls");
        this.excelExtensions.add("xlt");
        this.excelExtensions.add("xla");
        this.excelExtensions.add("xlsx");
        this.excelExtensions.add("xltx");
        this.excelExtensions.add("xlsm");
        this.excelExtensions.add("xltm");
        this.excelExtensions.add("xlam");
        this.excelExtensions.add("xlsb");
        this.excelExtensions.add("ods");
        this.excelExtensions.add("ots");
        //ppt extensions
        this.pptExtensions.add("ppt");
        this.pptExtensions.add("pot");
        this.pptExtensions.add("pps");
        this.pptExtensions.add("ppa");
        this.pptExtensions.add("pptx");
        this.pptExtensions.add("potx");
        this.pptExtensions.add("ppsx");
        this.pptExtensions.add("ppam");
        this.pptExtensions.add("pptm");
        this.pptExtensions.add("potm");
        this.pptExtensions.add("ppsm");
        this.pptExtensions.add("odp");
        this.pptExtensions.add("otp");
        // MS Office
        this.fileExtensionMap.set("doc", "application/msword");
        this.fileExtensionMap.set("dot", "application/msword");
        this.fileExtensionMap.set("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        this.fileExtensionMap.set("dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template");
        this.fileExtensionMap.set("docm", "application/vnd.ms-word.document.macroEnabled.12");
        this.fileExtensionMap.set("dotm", "application/vnd.ms-word.template.macroEnabled.12");
        this.fileExtensionMap.set("xls", "application/vnd.ms-excel");
        this.fileExtensionMap.set("xlt", "application/vnd.ms-excel");
        this.fileExtensionMap.set("xla", "application/vnd.ms-excel");
        this.fileExtensionMap.set("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        this.fileExtensionMap.set("xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template");
        this.fileExtensionMap.set("xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12");
        this.fileExtensionMap.set("xltm", "application/vnd.ms-excel.template.macroEnabled.12");
        this.fileExtensionMap.set("xlam", "application/vnd.ms-excel.addin.macroEnabled.12");
        this.fileExtensionMap.set("xlsb", "application/vnd.ms-excel.sheet.binary.macroEnabled.12");
        this.fileExtensionMap.set("ppt", "application/vnd.ms-powerpoint");
        this.fileExtensionMap.set("pot", "application/vnd.ms-powerpoint");
        this.fileExtensionMap.set("pps", "application/vnd.ms-powerpoint");
        this.fileExtensionMap.set("ppa", "application/vnd.ms-powerpoint");
        this.fileExtensionMap.set("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
        this.fileExtensionMap.set("potx", "application/vnd.openxmlformats-officedocument.presentationml.template");
        this.fileExtensionMap.set("ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow");
        this.fileExtensionMap.set("ppam", "application/vnd.ms-powerpoint.addin.macroEnabled.12");
        this.fileExtensionMap.set("pptm", "application/vnd.ms-powerpoint.presentation.macroEnabled.12");
        this.fileExtensionMap.set("potm", "application/vnd.ms-powerpoint.presentation.macroEnabled.12");
        this.fileExtensionMap.set("ppsm", "application/vnd.ms-powerpoint.slideshow.macroEnabled.12");
        // Open Office
        this.fileExtensionMap.set("odt", "application/vnd.oasis.opendocument.text");
        this.fileExtensionMap.set("ott", "application/vnd.oasis.opendocument.text-template");
        this.fileExtensionMap.set("oth", "application/vnd.oasis.opendocument.text-web");
        this.fileExtensionMap.set("odm", "application/vnd.oasis.opendocument.text-master");
        this.fileExtensionMap.set("odg", "application/vnd.oasis.opendocument.graphics");
        this.fileExtensionMap.set("otg", "application/vnd.oasis.opendocument.graphics-template");
        this.fileExtensionMap.set("odp", "application/vnd.oasis.opendocument.presentation");
        this.fileExtensionMap.set("otp", "application/vnd.oasis.opendocument.presentation-template");
        this.fileExtensionMap.set("ods", "application/vnd.oasis.opendocument.spreadsheet");
        this.fileExtensionMap.set("ots", "application/vnd.oasis.opendocument.spreadsheet-template");
        this.fileExtensionMap.set("odc", "application/vnd.oasis.opendocument.chart");
        this.fileExtensionMap.set("odf", "application/vnd.oasis.opendocument.formula");
        this.fileExtensionMap.set("odb", "application/vnd.oasis.opendocument.database");
        this.fileExtensionMap.set("odi", "application/vnd.oasis.opendocument.image");
        this.fileExtensionMap.set("oxt", "application/vnd.openofficeorg.extension");
    }

    getContentTypeForExtension(extension: string): string | null {
        if (this.fileExtensionMap.has(extension)) {
            return this.fileExtensionMap.get(extension);
        }
        return null;
    }

    getExtensionForContentType(contentType: string): string | null {
        for (const key of Array.from(this.fileExtensionMap.keys())) {
            const value = this.fileExtensionMap.get(key);
            if (value.toLowerCase() == (contentType || "").toLowerCase()) {
                return key;
            }
        }
        return null;
    }

    isWordLike(contentType: string): boolean {
        const extension = this.getExtensionForContentType(contentType);
        if (extension) {
            return this.wordExtensions.has(extension);
        }
        return false;
    }

    isExcelLike(contentType: string): boolean {
        const extension = this.getExtensionForContentType(contentType);
        if (extension) {
            return this.excelExtensions.has(extension);
        }
        return false;
    }

    isPowerpointLike(contentType: string): boolean {
        const extension = this.getExtensionForContentType(contentType);
        if (extension) {
            return this.pptExtensions.has(extension);
        }
        return false;
    }
}