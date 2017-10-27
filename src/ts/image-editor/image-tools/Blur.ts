import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

const brushSize = 20;

export class Blur implements Tool{
    widthRatio: number;
    heightRatio: number;
    imageView: ImageView;
    mouse: { x: number, y: number } = { x: 0, y: 0 };
    isBlurring: boolean;
    editingElement: any;

    drawBrush(): PIXI.Graphics{
        const brush = new PIXI.Graphics();
        brush.beginFill(0xFFFFFF, 1);
        brush.drawCircle(brushSize * this.widthRatio, brushSize * this.heightRatio, (brushSize * this.heightRatio));
        brush.lineStyle(0);
        brush.endFill();
        return brush;
    }

    get outputLeft(): number{
        return parseInt($(this.imageView.renderer.view).offset().left);
    }

    get outputTop(): number{
        return parseInt($(this.imageView.renderer.view).offset().top);
    }

    async apply(options?: any){
        
    }

    blurAt(){
        const texture = PIXI.Texture.fromImage(this.imageView.sprite.texture.baseTexture.imageUrl);
        const rect = new PIXI.Rectangle(
            this.mouse.x - (brushSize * this.widthRatio),
            this.mouse.y - (brushSize * this.heightRatio),
            (brushSize * this.widthRatio) * 2, (brushSize * this.heightRatio) * 2
        );
        if(rect.x < 0){
            rect.x = 0;
        }
        if(rect.y < 0){
            rect.y = 0;
        }
        if(rect.x + rect.width > this.imageView.sprite.width){
            rect.width -= (rect.x + rect.width) - (this.imageView.sprite.width - 10);
        }
        if(rect.y + rect.height > this.imageView.sprite.height){
            rect.height -= (rect.y + rect.height) - (this.imageView.sprite.height - 10);
        }

        const toBlur = new PIXI.Texture(texture.baseTexture, rect);
        const newSprite = new PIXI.Sprite(toBlur);
        newSprite.filters = [new PIXI.filters.BlurFilter(3 * this.widthRatio)];
        newSprite.width = (brushSize * this.widthRatio) * 2;
        newSprite.height = (brushSize * this.heightRatio) * 2;
        newSprite.position = {
            x: this.mouse.x - (brushSize * this.widthRatio),
            y: this.mouse.y - (brushSize * this.heightRatio)
        } as PIXI.Point;
        newSprite.mask = this.drawBrush();
        this.imageView.stage.addChild(newSprite);
        newSprite.addChild(newSprite.mask)
        this.imageView.render();
    }

    stop(){
        this.editingElement.off('mousedown.blur touchstart.blur')
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;

        let token;
        const animate = () => {
            if(!this.isBlurring){
                return;
            }
            this.blurAt();
            token = requestAnimationFrame(animate);
        }

        editingElement.find('canvas').css({ cursor: 'url(/assets/themes/entcore-css-lib/images/blur.png) 25 25, auto'})
        editingElement.on('mousedown.blur touchstart.blur', (e) => {
            if(e.target.tagName !== 'CANVAS'){
                return;
            }
            this.widthRatio =  this.imageView.renderer.width / editingElement.find('canvas').width();
            this.heightRatio = this.imageView.renderer.height / editingElement.find('canvas').height();
            this.drawBrush();
            this.mouse = {
                x: (e.pageX - this.outputLeft)  * this.widthRatio,
                y: (e.pageY - this.outputTop) * this.heightRatio
            }
            this.isBlurring = true;
            animate();
            
            $(window).on('mousemove.blur', (e) => {
                this.mouse = {
                    x: (e.pageX - this.outputLeft)  * this.widthRatio,
                    y: (e.pageY - this.outputTop) * this.heightRatio
                }
            });
            
            $(window).on('mouseup.blur touchend.blur', () => {
                $(window).off('mousemove.blur mouseup.blur touchend.blur')
                cancelAnimationFrame(token);
                this.imageView.backup(true);
                this.isBlurring = false;
            });
        });
    }
}