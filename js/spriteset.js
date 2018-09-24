(function(exports){
    if (typeof window === 'undefined'){
        // imports for node
        tools = require('./tools')
    }
    class SpriteSet {

        constructor(sprite){
            this.name = sprite.name;
            this.sprites = [];
            this.width = 0;
            this.height = 0;
            this.tileWidth = 0;
            this.tileHeight = 0;
            this.img = undefined;
            this.addSpritesheet(sprite)
        }

        //TODO only redraw for filter changes
        redraw() {
            let width = 0;
            let height = 0;
            this.tileWidth = 0;
            this.tileHeight = 0;
            // calculate dimensions
            for(sprite of this.sprites){
                for(attr of ['tileWidth', 'tileHeight']){
                    if(sprite[attr] > this[attr]){
                        this[attr] = sprite[attr]
                    }
                }
                if(sprite.img.height > height){
                    height = sprite.img.height;
                }
                if(sprite.img.width > width){
                    width = sprite.img.width;
                }
            }
            let canvas = tools.createCanvas(width, height)
            for(sprite of this.sprites){
                if(sprite.tileWidth == this.tileWidth && sprite.tileHeight == this.tileHeight){
                    ctx.drawImage(sprite.img, 0, 0)
                }else{
                    //copy and space
                    let cols = width / sprite.tileWidth;
                    let rows = height / sprite.tileHeight;
                    let xoffset = (this.tileWidth - sprite.tileWidth) / 2;
                    let yoffset = (this.tileHeight - sprite.tileHeight) / 2;
                    console.log(xoffset, yoffset);
                    for(let c = 0; c < cols; c++){
                        for(let r = 0; r < rows; r++){
                            ctx.drawImage(img, c * sprite.tileWidth, r * sprite.tileHeight, sprite.tileWidth, sprite.tileHeight,
                                          c * this.tileWidth  + xoffset, r * this.tileHeight + yoffset, sprite.tileWidth, sprite.tileHeight);
                        }
                    }
                }
            }
            this.img = canvas;
        }
    
        getTile(index) {
            let canvas = tools.createCanvas(this.tileWidth, this.tileHeight)
            let x = (index * this.tileWidth) % this.img.width;
            let y = Math.floor((index * this.tileWidth) / this.img.width) * this.tileHeight;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(this.img, -x, -y)
            return canvas
        }

        addSpritesheet(sprite){
            if(sprite.name != this.name){
                console.error('Spritesheet ${sprite.name} added to sprite set with mismatching name ${this.name}')
            }
            this.sprites.push(spritesheet);
        }
    }


    if(typeof module !== 'undefined'){
        //node
        module.exports = SpriteSet;
    }else{
        // browser
        this['SpriteSet'] = SpriteSet;
    }
}());