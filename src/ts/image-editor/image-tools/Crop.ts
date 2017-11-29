import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

export class Crop implements Tool{
    imageView: ImageView;
    editingElement: any;
    handle: any;

    get outputWidth(): number{
        return parseInt($(this.imageView.renderer.view).width());
    }

    get outputHeight(): number{
        return parseInt($(this.imageView.renderer.view).height());
    }

    get outputLeft(): number{
        return parseInt($(this.imageView.renderer.view).position().left);
    }

    get outputTop(): number{
        return parseInt($(this.imageView.renderer.view).position().top);
    }

    stop(){}

    apply(options?: any): Promise<any>{
        const handle = this.editingElement.find('.handle');
        let width = handle.width();
        if(handle.width() > this.outputWidth){
            width = handle.width() - (this.outputLeft - handle.position().left);
        }
        
        let height = handle.height();
        if(handle.height() > this.outputHeight){
            height = handle.height() - (this.outputHeight - handle.position().top);
        }

        let x = handle.position().left - this.outputLeft;
        let y = handle.position().top - this.outputTop;

        if(x > this.outputWidth || y > this.outputHeight){
            return;
        }

        if(x < 0){ x = 0; }
        if(y < 0){ y = 0; }

        if(width + x > this.outputWidth){
            width = this.outputWidth - x;
        }

        if(height + y > this.outputHeight){
            height = this.outputHeight - y;
        }

        const texture = PIXI.Texture.fromImage(this.imageView.sprite.texture.baseTexture.imageUrl);
        this.imageView.stage.removeChildren();
        const cropped = new PIXI.Texture(
            texture.baseTexture, new PIXI.Rectangle(
                parseInt(x * (this.imageView.renderer.width / this.outputWidth)),
                parseInt(y * (this.imageView.renderer.height / this.outputHeight)), 
                parseInt(width * (this.imageView.renderer.width / this.outputWidth)), 
                parseInt(height * (this.imageView.renderer.height / this.outputHeight))
            )
        );
        this.imageView.sprite = new PIXI.Sprite(cropped);
        this.imageView.stage.addChild(this.imageView.sprite);
        this.imageView.renderer.resize(this.imageView.sprite.width, this.imageView.sprite.height);
        this.imageView.render();

        return new Promise((resolve, reject) => {
            requestAnimationFrame(async () => {
                await this.imageView.backup();
                this.imageView.render();
                requestAnimationFrame(() => {
                    this.placeTools();
                    resolve();
                });
            });
        });
    }

    placeTools(){
        this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height());
        this.imageView.setOverlay();
        this.setHandle();
    }

    setHandle(){
        this.handle = this.editingElement.find('.handle');
        this.handle.addClass('show');
        this.handle.width($(this.imageView.renderer.view).width() - 4);
        this.handle.height($(this.imageView.renderer.view).height() - 4);
        this.handle.css({ 
            top: $(this.imageView.renderer.view).position().top + 'px', 
            left: $(this.imageView.renderer.view).position().left + 'px'
        });
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;
        this.imageView.render();

        setTimeout(() => {
            this.imageView.setOverlay();
            this.setHandle();
            this.handle.on('stopResize stopDrag', () => {
                this.imageView.pendingChanges = true;
                angular.element(this.editingElement).scope().$apply();
            });
        }, 200);
    }
}