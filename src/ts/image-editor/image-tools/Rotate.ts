import { ImageView } from '../ImageView';
import { Tool } from '../Tool';

export class Rotate implements Tool{
    imageView: ImageView;
    editingElement: any;

    apply(options?: any): Promise<any>{
        this.editingElement.find('.tools button').attr('disabled', true);
        this.imageView.sprite.rotation += (90 * (Math.PI / 180));
        this.imageView.renderer.resize(this.imageView.sprite.height, this.imageView.sprite.width);
        this.imageView.sprite.position = {
            x: this.imageView.sprite.height / 2,
            y: this.imageView.sprite.width / 2
        } as PIXI.Point;
        this.imageView.render();
        this.placeTools();
        
        return new Promise((resolve, reject) => {
            requestAnimationFrame(async () => {
                await this.imageView.backup();
                this.editingElement.find('.tools button').attr('disabled', false);
                resolve();
            });
        });
    }

    placeTools(){
        this.imageView.editingElement.find('.tools-background').height(
            this.editingElement.find('.output').height()
        );
    }

    stop(){}

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;

        this.imageView.sprite.pivot.set(this.imageView.sprite.width / 2, this.imageView.sprite.height / 2);
        this.imageView.renderer.resize(this.imageView.sprite.width, this.imageView.sprite.height);
        this.imageView.sprite.position = {
            x: this.imageView.sprite.width / 2,
            y: this.imageView.sprite.height / 2
        } as PIXI.Point;

        this.imageView.render();
        this.placeTools();
    }
}