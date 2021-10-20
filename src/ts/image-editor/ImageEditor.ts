import http from 'axios';
import { Eventer } from 'entcore-toolkit';
import { ImageView } from './ImageView';
import * as imageTools from './image-tools';
import { Tool } from './Tool';
import { Document } from '../workspace';
import { $ } from "../libs/jquery/jquery";

const eventer = new Eventer();
const editorWidth = 680;
const editorHeight = 400;

export class ImageEditor{
    static loaded: boolean;
    static loading: boolean;
    imageView: ImageView = new ImageView();
    renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
    editingElement: any;
    tool: Tool;
    document: Document;

    constructor(){

    }

    destroy(){
        this.imageView.renderer.destroy();
    }

    async cancel(keepHistory = false){
        $(this.imageView.renderer.view).css({ opacity: 0 });
        if(this.imageView.appliedIndex || this.imageView.pendingChanges){
            this.document.hiddenBlob = this.imageView.history[this.imageView.appliedIndex];
            await this.imageView.loadBlob(this.imageView.history[this.imageView.appliedIndex]);
        }
        if(!keepHistory){
            this.imageView.resetHistory();
        }
        
        await this.imageView.backup();

        if(!keepHistory){
            this.imageView.historyIndex = 0;
            this.imageView.appliedIndex = 0;
        }
        else{
            this.imageView.historyIndex = this.imageView.appliedIndex;
        }
        $(this.imageView.renderer.view).css({ opacity: 1 });
    }

    async useTool(name: string, options?){
        this.tool && this.tool.stop();
        if(this.imageView.historyIndex > 0){
            await this.cancel();
        }
        else{
            this.imageView.historyIndex = 0;
            this.imageView.appliedIndex = 0;
        }

        if(this.renderer){
            this.renderer.destroy();
        }
        
        if(name !== 'Blur'){
            this.drawCanvas();
        }
        else{
            this.drawGl();
        }
        
        const tool = new imageTools[name]();
        this.imageView.setStage();
        this.tool = tool;
        tool.start(this.imageView, this.editingElement);
    }

    async applyChanges(options?){
        if(this.tool){
            await this.tool.apply(options);
        }
        
        this.imageView.appliedIndex = this.imageView.historyIndex;
        this.imageView.pendingChanges = false;
    }

    async saveChanges(){
        if(this.imageView.history.length){
            this.document.hiddenBlob = this.imageView.history[this.imageView.appliedIndex];
        }
        await this.document.saveChanges();
    }

    get hasHistory(){
        return this.imageView.hasHistory;
    }

    get canApply(){
        return this.imageView.pendingChanges;
    }

    static async init(){
        return new Promise<void>((resolve, reject) => {
            if(ImageEditor.loaded){
                resolve();
                return;
            }
            if(ImageEditor.loading){
                eventer.on('loaded', () => resolve());
                return;
            }
            ImageEditor.loading = true;
            if(!(window as any).toBlobPolyfillLoaded){
                http.get('/infra/public/js/toBlob-polyfill.js').then((response) => {
                    eval(response.data);
                    (window as any).toBlobPolyfillLoaded = true;
                });
            }
            
            http.get('/infra/public/js/pixi.min.js').then((response) => {
                eval(response.data);
                ImageEditor.loaded = true;
                ImageEditor.loading = false;
                resolve();
                eventer.trigger('loaded');
            });
        })
    }

    drawGl(){
        this.editingElement.find('canvas').remove();
        this.renderer = PIXI.autoDetectRenderer (editorWidth, editorHeight, { 
            preserveDrawingBuffer: true,
            transparent: true
        });
        this.imageView.renderer = this.renderer;
        this.editingElement.find('.output').append(this.renderer.view);
        this.imageView.setStage();
    }

    drawCanvas(){
        this.editingElement.find('canvas').remove();
        this.renderer = new PIXI.CanvasRenderer (editorWidth, editorHeight, { 
            preserveDrawingBuffer: true,
            transparent: true
        });
        this.imageView.renderer = this.renderer;
        this.editingElement.find('.output').append(this.renderer.view);
        this.imageView.setStage();
    }


    draw(el: any){
        this.editingElement = el;
    }

    async drawDocument(document: Document){
        if(document.hiddenBlob){
            const path = URL.createObjectURL(document.hiddenBlob);
            await this.imageView.load(path,  this.editingElement, document.metadata['content-type']);
        }
        else{
            await this.imageView.load('/workspace/document/' + document._id + '?v=' + parseInt(Math.random() * 100), this.editingElement, document.metadata['content-type']);
        }
        
        this.document = document;
    }

    async restoreOriginal(){
        this.imageView.resetHistory();
        await this.imageView.loadBlob(this.imageView.originalImage);
        this.document.hiddenBlob = this.imageView.originalImage;
        this.tool.placeTools();
    }

    async undo(){
        await this.imageView.undo();
        this.tool.placeTools();
    }
}