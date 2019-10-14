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
    "bpr.lang.italian",
    "bpr.lang.spanish", 
    "bpr.lang.frensh", 
    "bpr.lang.german", 
    "bpr.lang.english", 
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
    "bpr.label.other"
];

export const allActivityTypes: string[] = [
    "bpr.label.other", 
    "bpr.activityType.classroomActivity", 
    "bpr.activityType.groupActivity", 
    "bpr.activityType.personalActivity", 
    "bpr.activityType.homework", 
    "bpr.activityType.exercize",
    "bpr.activityType.learningPath",
    "bpr.activityType.courseElement",
];


export const allLangages: string[] = [
    "bpr.lang.german", 
    "bpr.lang.english", 
    "bpr.lang.arabian", 
    "bpr.lang.spanish", 
    "bpr.lang.french", 
    "bpr.lang.italian", 
    "bpr.lang.japanese", 
    "bpr.lang.mandarinChinese", 
    "bpr.lang.portuguese", 
    "bpr.lang.russian", 
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
}

export interface IdAndLibraryResourceInformation {
    id: string;
    resourceInformation: LibraryResourceInformation;
}

export interface LibraryPublicationResponse {
    details: {
        activities: string[],
        activity_types: string[],
        age: string[],
        age_range: {
            gte: string, 
            lte: string
        },
        application: string,
        archive: string,
        counter: {
            count: number, 
            countable_id: string,
            countable_type: string
        },
        cover: string,
        created_at: string,
        description: string,
        id: string,
        keyWords: string[],
        language: string,
        licence: string,
        media: any[],
        pdfExport: string,
        resource_url: string,
        subject_areas: string[],
        subjects: string[],
        thumb_url: string,
        title: string,
        updated_at: string,
        user: {
            api_token: any,
            avatar_thumb_url: boolean,
            city: string,
            counter: {
                id: number, 
                count: number, 
                countable_id: string,
                countable_type: string,
                created_at: string,
                updated_at: string,
            },
            count: number,
            countable_id: string,
            countable_type: string,
            created_at: string,
            id: number,
            updated_at: string,
            country: string,
            district: string,
            email: string,
            email_verified_at: string,
            first_name: string,
            full_name: string,
            last_name: string,
            media: any[],
            platform_url: string,
            platform_user_id: string,
            school: string,
            username: string,
        },
        user_id: string,
        views: number
    };
    message: string;
    reason: string;
    success: boolean;
}