import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";
import { ui } from '../../ui';

export class Resize implements Tool{
    imageView: ImageView;
    editingElement: any;
    handle: any;
    isResizing: boolean;
    initialSize: {
        width: number,
        height: number
    };
    _scale: number;
    token: number;
    isInSetup: boolean;

    get ratio(){
        return this.initialSize.width / this.initialSize.height;
    }

    get scale(): number{
        if(this._scale){
            return this._scale;
        }
        if(!this.imageView || this.isInSetup){
            return 1;
        }
        if(this.imageView.sprite.width > this.imageView.sprite.height){
            let scale = this.outputWidth / this.imageView.sprite.width;
            this._scale = scale;
            if(scale > 1){
                this._scale = 1;
                return 1;
            }
            return scale;
        }
        if(this.imageView.sprite.height < parseInt(this.editingElement.find('.output').css('min-height'))){
            return 1;
        }
        let scale = this.outputHeight / this.imageView.sprite.height;
        this._scale = scale;
        if(scale > 1){
            return 1;
        }
        return scale;
    }

    get outputWidth(): number{
        return this.editingElement.find('.output').width();
    }

    get outputHeight(): number{
        return this.editingElement.find('.output').height();
    }

    stopResizing(){
        this.isResizing = false;
        cancelAnimationFrame(this.token);
        this.imageView.pendingChanges = true;
        angular.element(this.editingElement).scope().$apply();
    }

    setWidth(width: number){
        const height = (width / this.ratio) * this.scale;
        this.handle.width(width * this.scale);
        this.handle.height(height);
        this.isResizing = true;
        this.animate();
        setTimeout(() => this.stopResizing(), 400);
    }

    setHeight(height: number){
        const width = (height * this.ratio) * this.scale;
        this.handle.height(height * this.scale);
        this.handle.width(width);
        this.isResizing = true;
        this.animate();
        setTimeout(() => this.stopResizing(), 400);
    }

    apply(options?: any): Promise<any>{
        $(this.imageView.renderer.view).css({ opacity: 0 });
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.imageView.sprite.scale = new PIXI.Point(1, 1);
                this.imageView.render();
                
                    requestAnimationFrame(() => {
                        this.imageView.renderer.resize(
                            this.handle.width() / this.scale, 
                            this.handle.height() / this.scale
                        );
                        requestAnimationFrame(() => {
                            this.imageView.sprite.width = this.handle.width() / this.scale;
                            this.imageView.sprite.height = this.handle.height() / this.scale;
            
                            this.imageView.sprite.position = {
                                x: this.imageView.sprite.width / 2,
                                y: this.imageView.sprite.height / 2
                            } as PIXI.Point;
                    
                            this.imageView.render();

                            requestAnimationFrame(() => {
                                //hack for super weird iPad rendering bug
                                this.imageView.render();
                                $(this.imageView.renderer.view).css({ opacity: 1 });

                                requestAnimationFrame(async () => {
                                    await this.imageView.backup(false);
                                    resolve();
                                    this.setup();
                                });
                            });
                        });
                    });
            }, 180);
        });
    }

    placeTools(){
        this.setup();
    }

    resize(){
        this.imageView.sprite.width = parseInt(this.handle.width());
        this.imageView.sprite.height = parseInt(this.handle.height());
        this.editingElement.find('input[type=text]').first().val(parseInt(this.handle.width() / this.scale));
        this.editingElement.find('input[type=text]').last().val(parseInt(this.handle.height() / this.scale));
        this.imageView.sprite.position.x = (this.handle.position().left + 2) + this.imageView.sprite.width / 2;
        this.imageView.sprite.position.y = (this.handle.position().top + 2) + this.imageView.sprite.height / 2;
        this.imageView.render();
    }

    setHandle(){
        this.handle = this.editingElement.find('.handle');
        this.handle.addClass('show');
        this.handle.width(this.imageView.sprite.width - 4);
        this.handle.height(this.imageView.sprite.height - 4);
        this.handle.css({ 
            top: (this.imageView.sprite.position.y - this.imageView.sprite.height / 2) + 'px', 
            left: (this.imageView.sprite.position.x - this.imageView.sprite.width / 2) + 'px'
        });
        ui.extendElement.resizable(this.handle, { preserveRatio: true });
    }

    lockOutput(){
        this.editingElement.find('.output').height(this.editingElement.find('.output').height());
    }

    setup(){
        this.isInSetup = true;
        this._scale = 0;
        this.imageView.sprite.scale = new PIXI.Point(1, 1);
        this.imageView.render();

        $(this.imageView.renderer).attr('data-locked-size', true);
        if(this.outputHeight > this.imageView.sprite.height){
            this.editingElement.find('.output').height(this.imageView.sprite.height);
            setTimeout(() => this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height()), 50);
        }
        else{
            if(this.imageView.sprite.height < 600){
                this.editingElement.find('.output').height(this.imageView.sprite.height);
                setTimeout(() => this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height()), 50);
            }
            else{
                this.editingElement.find('.output').height(600);
                setTimeout(() => this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height()), 50);
            }
        }
        requestAnimationFrame(() => {
            this.imageView.setOverlay();
            
            this.imageView.renderer.resize(this.outputWidth, this.outputHeight);
            this.imageView.sprite.pivot.set(this.imageView.sprite.width / 2, this.imageView.sprite.height / 2);
            requestAnimationFrame(() => {
                this.isInSetup = false;
                this.imageView.sprite.scale = new PIXI.Point(this.scale, this.scale);
                this.imageView.sprite.position = {
                    x: this.imageView.renderer.width / 2,
                    y: this.imageView.renderer.height / 2
                } as PIXI.Point;
                requestAnimationFrame(() => {
                    console.log('finish setup')
                    this.lockOutput();
                    this.setHandle();
                    setTimeout(() => $(this.imageView.renderer.view).css({ opacity: 1 }), 100);
                    this.editingElement.find('input[type=text]').first().val(parseInt(this.imageView.sprite.width / this.scale));
                    this.editingElement.find('input[type=text]').last().val(parseInt(this.imageView.sprite.height / this.scale));
                    angular.element(this.editingElement).scope().$apply();
                });
                
                this.imageView.render();
            });
            
            this.imageView.render();
            
            
        });
    }

    stop(){
        this.editingElement.find('.output').removeAttr('style');
        setTimeout(() => this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height()), 200);
        $(this.imageView.renderer).attr('data-locked-size', false);
        this.imageView.renderer.resize(this.initialSize.width, this.initialSize.height);
        this.imageView.sprite.width = this.initialSize.width;
        this.imageView.sprite.height = this.initialSize.height;
        this.imageView.sprite.pivot.set(this.initialSize.width / 2, this.initialSize.height / 2);
        
        this.imageView.sprite.position = {
            x: this.initialSize.width / 2,
            y: this.initialSize.height / 2
        } as PIXI.Point;
        this.imageView.render();
        this.editingElement.off('startResize stopResize startDrag stopDrag');
    }

    animate(){
        if(!this.isResizing){
            return;
        }
        this.resize();
        this.token = requestAnimationFrame(() => this.animate());
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;
        this.initialSize = {
            height: this.imageView.sprite.height,
            width: this.imageView.sprite.width
        };

        editingElement.on('startResize', '.handle', () => {
            this.isResizing = true;
            this.animate();
        });

        editingElement.on('stopResize', '.handle', () => this.stopResizing());

        editingElement.on('startDrag', '.handle', () => {
            this.isResizing = true;
            this.animate();
        });
        
        editingElement.on('stopDrag', '.handle', () => this.stopResizing());

        setTimeout(() => this.setup(), 150);
    }
}