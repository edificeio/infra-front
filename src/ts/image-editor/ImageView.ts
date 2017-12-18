import { Eventer } from 'entcore-toolkit';
import { $ } from "../index";

export class ImageView{
    sprite: PIXI.Sprite;
    stage: PIXI.Container;
    renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
    history: Blob[] = [];
    editingElement: any;
    historyIndex: number;
    eventer = new Eventer();
    originalImage: Blob;
    appliedIndex: number;
    pendingChanges: boolean;
    format: string;

    private paint(image: string): Promise<any>{
        return new Promise((resolve, reject) => {
            this.stage = new PIXI.Container();
            this.sprite = new PIXI.Sprite(
                PIXI.loader.resources[image].texture
            )
            this.stage.addChild(this.sprite);
            
            setTimeout(async () => {
                this.sprite.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
                
                this.sprite.position = {
                    x: this.sprite.width / 2,
                    y: this.sprite.height / 2
                } as PIXI.Point;
                
                this.historyIndex = 0;
                requestAnimationFrame(() => 
                    this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height())
                );
                resolve();
            }, 100);
        });
    }

    render(){
        this.renderer.render(this.stage);
    }

    resetHistory(){
        this.appliedIndex = 0;
        this.historyIndex = 0;
        this.history = [];
        this.pendingChanges = false;
    }

    get hasHistory(): boolean{
        return this.appliedIndex > 1;
    }

    loadImage(image: HTMLImageElement, repaint = true): Promise<any>{
        return new Promise((resolve, reject) => {
            this.stage.removeChildren();
            this.sprite = new PIXI.Sprite(PIXI.Texture.from(image));
            this.stage.addChild(this.sprite);
            this.renderer.render(this.stage);
            if(!repaint){
                resolve();
                return;
            }
            
            setTimeout(() => {
                this.sprite.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
                if(!$(this.renderer).attr('data-locked-size')){
                    this.renderer.resize(this.sprite.width, this.sprite.height);
                }
                
                this.sprite.position = {
                    x: this.sprite.width / 2,
                    y: this.sprite.height / 2
                } as PIXI.Point;
                
                this.render();
                this.eventer.trigger('image-loaded');
                resolve();
            }, 100);
        });
    }

    setOverlay(){
        this.editingElement.find('.overlay').width($(this.editingElement.find('.output')).width());
        this.editingElement.find('.overlay').height($(this.editingElement.find('.output')).height());
    }

    load(image: string, editingElement: any, format: string): Promise<any>{
        this.format = format;
        return new Promise((resolve, reject) => {
            this.editingElement = editingElement;
            const onload = () => {
                this.paint(image)
                    .then(() => resolve());
                this.eventer.trigger('loaded-' + image);
            };
    
            if(PIXI.loader.resources[image]){
                if(PIXI.loader.resources[image].isLoading){
                    this.eventer.once('loaded-' + image, onload);
                    return;
                }
                onload();
                return;
            }
            const loaderOptions = {
                loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
                xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB
            };
            PIXI.loader
                .add(image, image, loaderOptions)
                .load(onload);
        });
    }

    loadBlob(blob: Blob, repaint = true): Promise<any>{
        return new Promise((resolve, reject) => {
            const imageUrl = URL.createObjectURL(blob);
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => {
                this.loadImage(image, repaint).then(() => resolve());
            };
        });
    }

    setStage(){
        this.renderer.render(this.stage);
        this.renderer.resize(this.sprite.width, this.sprite.height);
        this.renderer.render(this.stage);
    }

    undo(): Promise<any>{
        $(this.renderer.view).css({ opacity: 0 });
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                this.historyIndex --;
                if(this.appliedIndex > this.historyIndex){
                    this.appliedIndex = this.historyIndex;
                }
                
                await this.loadBlob(this.history[this.historyIndex - 1]);
                $(this.renderer.view).css({ opacity: 1 });
                resolve();
            }, 150);
        });
    }

    backup(repaint = true, updateHistory = true): Promise<any>{
        return new Promise((resolve, reject) => {
            this.renderer.view.toBlob((blob) => {
                this.render();
                this.historyIndex ++;
                this.history.splice(this.historyIndex);
                this.history.push(blob);
                if(this.historyIndex > this.history.length){
                    this.historyIndex = this.history.length;
                }
                if(!this.originalImage){
                    this.originalImage = blob;
                }
                
                this.loadBlob(blob, repaint).then(() => {
                    resolve();
                });
            }, this.format);
        });
    }
}