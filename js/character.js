(function(exports){
    if (typeof window === 'undefined'){
        tools = require('./tools')
        //assetManager = require('./assetmanager')
    }
    class Character {

        constructor(selection, am){
            if(am)
                assetManager = am
            this.sex = 1;
            this.selection = {};
            if(selection){
                this.setSelection(selection);
            }
        }


    //extract active layers from location bar
    getLayers(){
        let sprites = [];
        let width = 1;
        let height = 1;
        //extract used assets from location bar
        let hash = this.selection;//.split('.');
        for (let i in hash){ if(i != 'sex'){
            let category = decodeURI(hash[i]).split('.');
            let name = category.pop();
            let lastCat = assetManager.categories;
            for (let j in category) {
                if(lastCat)
                    lastCat = lastCat.getCategory(category[j]);
            }
            if(lastCat)
                for (let j in lastCat.getSpriteset(name)){
                    //only include spritesets with correct sex
                    let sprite = lastCat.getSpriteset(name)[j];
                    if(sprite.sex == 0 || sprite.sex & this.getSex()){
                        sprites.push(sprite);
                    }
                }
        }}

        let layers = [];
        //place each spritesheet in correct layer
        for(let i = assetManager.layers.min; i <= assetManager.layers.max; i++){
            let newLayer = i + assetManager.layers.min;
            layers[newLayer] = [];
            for(let j in sprites){
                if(sprites[j].layer == i){
                    if(sprites[j].img){
                        layers[newLayer].push(sprites[j])
                        if(sprites[j].img.width > width)
                            width = sprites[j].img.width
                        if(sprites[j].img.height > height)
                            height = sprites[j].img.height
                    }else{
                        console.error('Sprite "' + sprites[j].name + '" not loaded');
                    }
                }
            }
        }
        return {'layers': layers, 'height': height, 'width': width};
    }

    draw(){
        let layers = this.getLayers();
        //TODO: calculate dimensions
        let canvas = tools.createCanvas(layers.width, layers.height);
        let ctx = canvas.getContext('2d');
        for (let layer in layers.layers){
            for (let sprite in layers.layers[layer]){
                ctx.drawImage(layers.layers[layer][sprite].img, 0, 0)
            }
        }
        return canvas;
    }

    setSelection(selection){
        if(selection.sex){
            this.sex = selection.sex;
            delete selection.sex;
        }else{
            this.sex = 1
        }

        this.selection = selection;
    }

    getSex(){
        return this.sex;
    }

    }
    if(typeof module !== 'undefined'){
        //node
        module.exports = Character;
    }else{
        // browser
        this['Character'] = Character;
    }
}());