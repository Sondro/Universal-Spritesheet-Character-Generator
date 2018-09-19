(function(){
    class Spritesheet {
        constructor(name, src, width, height, attributes = {}, palette, loadcallback){
            this.name = name;
            this.src = src;
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
            let that = this;
            //load one after the other
            tools.loadImage(src, width,  height, function(img){
                that.img = img
                if(palette && attributes['palette']){
                    lpcGenerator.loadPalette(palette, function(p){
                        that.newPalette = p;
                        that.switchPalette(loadcallback);
                    })
                    lpcGenerator.loadPalette(attributes['palette'], function(p){
                        that.oldPalette = p;
                        that.switchPalette(loadcallback);
                    })
                }else{
                    if(loadcallback)loadcallback();
                }
                lpcGenerator.updateGui;
            });
        }

        //use red channel of mask image as alpha channel
        //white=visible;black=invisible
        //it is assumed that mask and image have the same size
        //TODO: not used yet
        applyMask(mask){
            //transform images into canvases
            let can = tools.cloneImg(this.img);
            let mcan = tools.cloneImg(mask);
            let ctx = can.getContext('2d');
            let imageData = ctx.getImageData(0, 0, this.img.width, this.img.height);
            let mimageData = mcan.getContext('2d').getImageData(0, 0, mask.width, mask.height);
            // one dimensional array with RGBA
            for(let j = 0; j < imageData.data.length; j+=4){
                imageData.data[j+3] = mimageData.data[j];
            }
            ctx.putImageData(imageData,0,0);
            this.img = can;
            lpcGenerator.updateGui;
        }

        //change color palette of image
        switchPalette(loadcallback) {
            if(this.oldPalette && this.newPalette){
                let can = document.createElement("canvas");
                can.height = this.img.height;
                can.width = this.img.width;
                let ctx = can.getContext('2d');
                ctx.drawImage(this.img, 0, 0)
                let imageData = ctx.getImageData(0, 0, this.img.width, this.img.height);
                //always choose the smallest size
                let size = this.oldPalette.length;
                if(size > this.newPalette.length){
                    size = this.newPalette.length;
                }
                for(let i = 0; i < size; i++){
                    // one dimensional array with RGBA
                    for(let j = 0; j < imageData.data.length; j+=4){
                        if(imageData.data[j] == this.oldPalette[i].red
                        && imageData.data[j+1] == this.oldPalette[i].green
                        && imageData.data[j+2] == this.oldPalette[i].blue){
                            imageData.data[j] = this.newPalette[i].red
                            imageData.data[j+1] = this.newPalette[i].green
                            imageData.data[j+2] = this.newPalette[i].blue  
                        }
                    }
                }
                ctx.putImageData(imageData,0,0);
                this.img = can;
                lpcGenerator.updateGui;
                if(loadcallback)loadcallback();
            }
        }


    }
    this['Spritesheet'] = Spritesheet;
}());