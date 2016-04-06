export declare var recorder: {
    protected: boolean;
    elapsedTime: number;
    loadComponents: () => void;
    isCompatible: () => boolean;
    stop: () => void;
    flush: () => void;
    record: () => void;
    pause: () => void;
    play: () => void;
    state: (callback: any) => void;
    title: string;
    status: string;
    save: (callback: any, format?: any) => void;
    mute: (mute: any) => void;
};
