export interface LibraryResourceInformation {
    title: string;
    cover: string;
    application: string;
    pdfUri: string;
}

export const allSubjectAreas: string[] =  [
    "bpr.subjectArea.artActivity", 
    "bpr.subjectArea.readLearning", 
    "bpr.subjectArea.chemistry", 
    "bpr.subjectArea.law", 
    "bpr.subjectArea.worldDiscovery", 
    "bpr.subjectArea.economy", 
    "bpr.subjectArea.mediaEducation", 
    "bpr.subjectArea.musicEducation", 
    "bpr.subjectArea.sportEducation", 
    "bpr.subjectArea.citizenshipEducation", 
    "bpr.subjectArea.geography", 
    "bpr.subjectArea.history", 
    "bpr.subjectArea.artHistory", 
    "bpr.subjectArea.ComputerScience", 
    "bpr.subjectArea.languages", 
    "bpr.subjectArea.italian",
    "bpr.subjectArea.spanish",
    "bpr.subjectArea.frensh",
    "bpr.subjectArea.german",
    "bpr.subjectArea.english",
    "bpr.subjectArea.ancientLanguages", 
    "bpr.subjectArea.literature", 
    "bpr.subjectArea.mathematics", 
    "bpr.subjectArea.vocationalGuidance", 
    "bpr.subjectArea.philosohppy", 
    "bpr.subjectArea.physics", 
    "bpr.subjectArea.politicalSscience", 
    "bpr.subjectArea.sociology", 
    "bpr.subjectArea.biology", 
    "bpr.subjectArea.geology", 
    "bpr.subjectArea.technology",
    "bpr.other"
];

export const allActivityTypes: string[] = [
    "bpr.other",
    "bpr.activityType.classroomActivity", 
    "bpr.activityType.groupActivity", 
    "bpr.activityType.personalActivity", 
    "bpr.activityType.homework", 
    "bpr.activityType.exercize",
    "bpr.activityType.learningPath",
    "bpr.activityType.courseElement",
];


export const allLangages: string[] = [
    "de_DE",
    "en_EN",
    "ar_DZ",
    "es_ES",
    "fr_FR",
    "it_IT",
    "ja_JP",
    "zh_CN",
    "pt_PT",
    "ru_RU",
    "bpr.other"
];

export interface LibraryPublication {
    title: string;
    cover: Blob;
    language: string;
    activityType: string[];
    subjectArea: string[];
    age: [number, number];
    description: string;
    keyWords: string;
    pdfUri: string;
    application: string;
    licence: string;
    teacherAvatar: Blob;
    resourceId: string;
    userStructureName: string;
}

export interface IdAndLibraryResourceInformation {
    id: string;
    resourceInformation: LibraryResourceInformation;
}

export interface LibraryPublicationResponse {
    details: {
        application: string,
        created_at: string,
        description: string,
        front_url: string,
        id: string,
        title: string
    };
    message: string;
    reason: string;
    success: boolean;
}