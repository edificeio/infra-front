import { ImageView } from './ImageView';

export interface Tool{
    apply(options?: any): Promise<any>;
    start(imageView: ImageView, editingElement: any);
    stop();
    setup?();
    placeTools();
    canApply?: boolean;
}