(function () {
    if (typeof window === 'undefined') {
        // imports for node
        //AssetManager = require('./assetmanager')
        //TODO: mutual require does not work
        assetManager = { 'loadPalette': function () { } }
        tools = require('./tools')
    }
    class Spritesheet {
        constructor(name, src, width, height, tileWidth, tileHeight, attributes = {}, palette, loadcallback, assetManager, animations) {
            this.name = name;
            this.src = assetManager.baseDir + src;
            //original title of the asset
            this.title = attributes['title'];
            this.layer = attributes['layer'];
            this.category = attributes['category'].split(';');
            //author names corresponding to authors/<name>.json
            this.author = attributes['author'].split(';');
            //1: male, 3: female etc.
            this.sex = attributes['sex'];
            this.license = attributes['license'].split(';');
            //url of the source
            this.url = attributes['url'];
            this.tileWidth = tileWidth;
            this.tileHeight = tileHeight;
            this.filters = attributes['filters'];
            this.supportedAnimations = {}
            let that = this;
            //load one after the other
            tools.loadImage(this.src, assetManager.cache, width, height, function (img) {
                that.img = img
                that.remap(animations, assetManager.generalAnimations)
                if (palette && attributes['palette']) {
                    assetManager.loadPalette(palette, function (p) {
                        that.newPalette = p;
                        that.switchPalette(assetManager.generalAnimations, loadcallback);
                    })
                    assetManager.loadPalette(attributes['palette'], function (p) {
                        that.oldPalette = p;
                        that.switchPalette(assetManager.generalAnimations, loadcallback);
                    })
                } else {
                    if (loadcallback) loadcallback();
                }
            });
        }

        remap(animations, generalAnimations) {//TODO: store which animations are supported
            let width = 0;
            let height = 0;
            //calculate size of unified image
            for (let i in generalAnimations) {
                let aniWidth = generalAnimations[i].frames * this.tileWidth;
                let aniHeiht = generalAnimations[i].directions * this.tileHeight;
                // find widest animation
                if (aniWidth > width)
                    width = aniWidth;
                height += aniHeiht;
            }
            let canvas = tools.createCanvas(width, height);
            let ctx = canvas.getContext('2d');
            let row = 0;
            for (let i in generalAnimations) {
                for (let direction = 0; direction < generalAnimations[i].directions; direction++) {
                    // not every spritesheet offers all animations
                    if (animations[i] && animations[i].mapping && animations[i].mapping[direction]) {
                        this.supportedAnimations[i] = true;
                        let frames = animations[i].mapping[direction]
                        for (let frame in frames) {
                            if (frame) {
                                // copy tile to new position
                                let index = frames[frame];
                                let x = (index * this.tileWidth) % this.img.width;
                                let y = Math.floor((index * this.tileWidth) / this.img.width) * this.tileHeight;
                                ctx.drawImage(this.img, x, y, this.tileWidth, this.tileHeight, frame * this.tileWidth, row * this.tileHeight, this.tileWidth, this.tileHeight)
                            }
                        }
                    }
                    //each direction has it’s own row
                    row++
                }
            }
            //replace image
            delete this.img;
            this.img = canvas;
        }

        //use red channel of mask image as alpha channel
        //white=visible;black=invisible
        //it is assumed that mask and image have the same size
        //TODO: not used yet
        applyMask(mask) {
            //transform images into canvases
            let can = tools.cloneImg(this.img);
            let mcan = tools.cloneImg(mask);
            let ctx = can.getContext('2d');
            let imageData = ctx.getImageData(0, 0, this.img.width, this.img.height);
            let mimageData = mcan.getContext('2d').getImageData(0, 0, mask.width, mask.height);
            // one dimensional array with RGBA
            for (let j = 0; j < imageData.data.length; j += 4) {
                imageData.data[j + 3] = mimageData.data[j];
            }
            ctx.putImageData(imageData, 0, 0);
            this.img = can;
        }

        //change color palette of image
        //only switch pixels that are actually seen later
        switchPalette(generalAnimations, loadcallback) {
            if (this.oldPalette && this.newPalette) {
                let can = this.img;
                if (!can.getContext)
                    can = tools.cloneImg(this.img);
                let ctx = can.getContext('2d');
                let imageData = ctx.getImageData(0, 0, this.img.width, this.img.height);
                //always choose the smallest size
                let size = this.oldPalette.length;
                if (size > this.newPalette.length) {
                    size = this.newPalette.length;
                }
                // coordinates are easier to use
                for (let i = 0; i < size; i++) {
                    let yoffset = 0;
                    for (let anim in generalAnimations) {
                        let animHeight = generalAnimations[anim].directions * this.tileHeight;
                        let animWidth = generalAnimations[anim].frames * this.tileHeight;
                        // skip if not supported
                        if (this.supportedAnimations[anim]) {
                            // loop through animation
                            for (let y = 0; y < animHeight; y++) {
                                for (let x = 0; x < animWidth; x++) {
                                    // y is vertical, each pixel has RGBA
                                    let position = (x + ((y + yoffset) * can.width)) * 4;
                                    if (imageData.data[position] == this.oldPalette[i].red
                                        && imageData.data[position + 1] == this.oldPalette[i].green
                                        && imageData.data[position + 2] == this.oldPalette[i].blue) {
                                        imageData.data[position] = this.newPalette[i].red
                                        imageData.data[position + 1] = this.newPalette[i].green
                                        imageData.data[position + 2] = this.newPalette[i].blue
                                    }
                                }
                            }
                        }
                        yoffset += animHeight;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                this.img = can;
                //lpcGenerator.updateGui;
                if (loadcallback) loadcallback();
            }
        }


    }
    if (typeof module !== 'undefined') {
        //node
        module.exports = Spritesheet;
    } else {
        // browser
        this['Spritesheet'] = Spritesheet;
    }
}());