(function(exports){
    if (typeof window === 'undefined'){
        tools = require('./tools')
        //assetManager = require('./assetManager')
    }
    class Character {

        constructor(selection, am){
            //only set for node, otherwise use  the global object
            if(am)
                assetManager = am
            this.selection = {};
            if(selection){
                this.setSelection(selection);
            }
            this.img = undefined;
            this.tileHeight = 0;
            this.tileWidth = 0;
        }


    //extract active layers from location bar
    getLayers(){
        let sprites = [];
        let width = 1;
        let height = 1;
        let tileWidth = 1;
        let tileHeight = 1;
        let supportedAnimations = {};
        // initialize all possible animations
        for(let anim in assetManager.generalAnimations){
            supportedAnimations[anim] = true;
        }
        //extract used assets from location bar
        let hash = this.selection;
        for (let i in hash){
            let category = Array.from(hash[i]);
            let name = category.pop();
            let lastCat = assetManager.categories;
            for (let j in category) {
                if(lastCat){
                    lastCat = lastCat.getCategory(category[j]);
                }
            }
            if(lastCat){
                let setAnimations = {};
                for (let j in lastCat.getSpriteset(name)){
                    //only include spritesets with correct sex
                    let sprite = lastCat.getSpriteset(name)[j];
                    let match = true;
                    for(let filter in assetManager.filters){
                        let matched = assetManager.filters[filter].match(sprite, this.selection)
                        match = match && matched
                    }
                    if(match){
                        sprites.push(sprite);
                        // add to supported set animations
                        for(let anim in sprite.supportedAnimations){
                            setAnimations[anim] = true;
                        }
                    }
                }
                // remove unsupported animations
                if(!assetManager.incompleteAnimations)
                    for(let anim in supportedAnimations){
                        if(!setAnimations[anim])
                            supportedAnimations[anim] = false;
                    }
            }
        }

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
                        if(sprites[j].tileWidth > tileWidth)
                            tileWidth = sprites[j].tileWidth
                        if(sprites[j].tileHeight > tileHeight)
                            tileHeight = sprites[j].tileHeight
                    }else{
                        console.error('Sprite "' + sprites[j].name + '" not loaded');
                    }
                }
            }
        }
        return {'layers': layers, 'height': height, 'width': width, 'tileHeight': tileHeight, 'tileWidth': tileWidth, 'animations': supportedAnimations};
    }

    redraw(){
        let layers = this.getLayers();
        let canvas = tools.createCanvas(layers.width, layers.height);
        let ctx = canvas.getContext('2d');
        for (let layer in layers.layers){
            for (let s in layers.layers[layer]){
                let sprite = layers.layers[layer][s]
                let img = sprite.img
                if(sprite.tileWidth == layers.tileWidth && sprite.tileHeight == layers.tileHeight){
                    ctx.drawImage(sprite.img, 0, 0)
                }else{
                    let cols = img.width / sprite.tileWidth;
                    let rows = img.height / sprite.tileHeight;
                    let xoffset = (layers.tileWidth - sprite.tileWidth) / 2;
                    let yoffset = (layers.tileHeight - sprite.tileHeight) / 2;
                    if(assetManager.allign == 'l')
                        xoffset = 0;
                    if(assetManager.allign == 'r')
                        xoffset = xoffset * 2;
                    if(assetManager.allign == 't')
                        yoffset = 0;
                    if(assetManager.allign == 'b')
                        yoffset = yoffset * 2;
                    for(let c = 0; c < cols; c++){
                        for(let r = 0; r < rows; r++){
                            ctx.drawImage(img, c * sprite.tileWidth, r * sprite.tileHeight, sprite.tileWidth, sprite.tileHeight,
                                            c * layers.tileWidth  + xoffset, r * layers.tileHeight + yoffset, sprite.tileWidth, sprite.tileHeight);
                        }
                    }
                }
            }
        }
        this.img = canvas;
        this.tileHeight = layers.tileHeight;
        this.tileWidth = layers.tileWidth;
    }

    // export preview canvas of spriteset
    exportPreview(spriteset){
        let tileWidth = 0;
        let tileHeight = 0;
        let sprites = [];
        let animation = assetManager.defaultAnimation;
        let supportedAnimations = {}

        for (let j in spriteset){
            //only include spritesets with correct sex
            let sprite = spriteset[j];
            let match = true;
            for(let filter in assetManager.filters){
                let matched = assetManager.filters[filter].match(sprite, this.selection)
                match = match && matched
            }
            if(match){
                for(let anim in  sprite.supportedAnimations){
                    supportedAnimations[anim] = true
                }
                sprites.push(sprite);
                if(sprite.tileWidth > tileWidth)
                    tileWidth = sprite.tileWidth
                if(sprite.tileHeight > tileHeight)
                    tileHeight = sprite.tileHeight
            }
        }
        if(!supportedAnimations[animation])
            for(let anim in supportedAnimations){
                //select first
                animation = anim;
                break;
            }
        let canvas = tools.createCanvas(tileWidth, tileHeight);
        let ctx = canvas.getContext('2d');
        for(let sprite of sprites){
            // only draw if it has this animation and image already loaded
            if(sprite.supportedAnimations[animation] && sprite.img){
                let c = 0;
                let r = assetManager.generalAnimations[animation].row;
                let xoffset = (tileWidth - sprite.tileWidth) / 2;
                let yoffset = (tileHeight - sprite.tileHeight) / 2;
                if(assetManager.allign == 'l')
                        xoffset = 0;
                if(assetManager.allign == 'r')
                    xoffset = xoffset * 2;
                if(assetManager.allign == 't')
                    yoffset = 0;
                if(assetManager.allign == 'b')
                    yoffset = yoffset * 2;
                ctx.drawImage(sprite.img, c * sprite.tileWidth, r * sprite.tileHeight, sprite.tileWidth, sprite.tileHeight,
                    xoffset, yoffset, sprite.tileWidth, sprite.tileHeight);
            }
        }
        return canvas;
    }

    // position must be >0, gets limited with modulo
    getFrame(animation, direction, position){
        let can = tools.createCanvas(1, 1);
        return can;
    }

    generateAttribution(syntax){
        let tmpAttr = "";
        let layers = this.getLayers().layers;
        for (let layer in layers){
            for (let i in layers[layer]){
                let sprite = layers[layer][i];
                let name = sprite.src.split('/').pop();
                let licenses = ''
                //link all licences
                for (let l in sprite.license){
                    if(l > 0)
                        licenses += ', ';
                    let licenseUrl = '#'
                    switch(sprite.license[l].toLowerCase()){
                        case 'gnu gpl 2.0':
                            licenseUrl = 'https://www.gnu.org/licenses/gpl-2.0.en.html';
                            break;
                        case 'gnu gpl 3.0':
                            licenseUrl = 'https://www.gnu.org/licenses/gpl-3.0.en.html';
                            break;
                        case 'cc by 3.0':
                            licenseUrl = 'https://creativecommons.org/licenses/by/3.0/';
                            break;
                        case 'cc by 4.0':
                            licenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
                            break;
                        case 'cc by-sa 3.0':
                            licenseUrl = 'https://creativecommons.org/licenses/by-sa/3.0/';
                            break;
                        case 'cc by-sa 4.0':
                            licenseUrl = 'https://creativecommons.org/licenses/by-sa/4.0/';
                            break;
                        case 'oga by 3.0':
                            licenseUrl = 'https://opengameart.org/content/oga-by-30-faq';
                            break;
                        case 'cc0':
                            licenseUrl = 'http://creativecommons.org/publicdomain/zero/1.0/';
                            break;
                    }
                    switch(syntax){
                        case 'md':
                            licenses += `[${sprite.license[l]}](${licenseUrl})`
                            break;
                        case 'wiki':
                            licenses += `[${licenseUrl} ${sprite.license[l]}]`
                            break;
                        case 'plain':
                            licenses += `${sprite.license[l]}`
                            break;
                        default:
                        case 'html':
                            licenses += `<a href="${licenseUrl}">${sprite.license[l]}</a>`
                    }
                }

                let authors = ''
                //list all author to profile
                for (let a in sprite.author){
                    let author = assetManager.authors[sprite.author[a]];
                    if(a > 0)
                        authors += ', ';
                    if(!author){
                        assetManager.authors[sprite.author[a]] = new Author(sprite.author[a], '#');
                    }
                    if(author.url == '#'){
                        authors += author.name;
                    }else{
                        switch(syntax){
                            case 'md':
                                authors += `[${author.name}](${author.url})`
                                break;
                            case 'wiki':
                                authors += `[${author.url} ${author.name}]`
                                break;
                            case 'plain':
                                authors += `${author.name}`
                                break;
                            default:
                            case 'html':
                                authors += `<a href="${author.url}">${author.name}</a>`
                        }
                    }
                }
                switch(syntax){
                    case 'md':
                        tmpAttr += `[${name}](${sprite.src}) licensed under ${licenses} as [${sprite.title}](${sprite.url}) by ${authors}\n`
                        break;
                    case 'wiki':
                        tmpAttr += `[${sprite.src} ${name}] licensed under ${licenses} as [${sprite.url} ${sprite.title}] by ${authors}\n`
                        break;
                    case 'plain':
                        tmpAttr += `"${sprite.src}" licensed under ${licenses} as "${sprite.title}" at ${sprite.url} by ${authors}\n`
                        break;
                    default:
                    case 'html':
                        tmpAttr += `<a href="${sprite.src}">${name}</a> licensed under ${licenses} as <a href="${sprite.url}">${sprite.title}</a> by ${authors}<br/>`
                }
            }
        }
        return tmpAttr;
    }

    setSelection(selection){
        let tmpSel = {};
        for (let i in selection){
            tmpSel[i] = []
            if(selection[i]){
                let split = selection[i].split('.');
                for(let j in split){
                    tmpSel[i].push(decodeURI(split[j]))
                }
            }
        }
        // check filters with default values
        // otherwise the menu would be rather empty
        for(let f in assetManager.filters){
            let filter = assetManager.filters[f];
            if(filter.default && !tmpSel[f]){
                tmpSel[f] = [f, filter.default];
            }
        }
        // set cheat codes
        for(let cheat of ['ignoreFilter', 'ignoreMandatory', 'incompleteAnimations']){
            if(tmpSel[cheat.toLowerCase()])
                if(tmpSel[cheat.toLowerCase()] == 'true')
                    assetManager[cheat] = true;
                else
                    assetManager[cheat] = false;
            if(assetManager[cheat])
                tmpSel[cheat]= 'true'
        }
        this.selection = tmpSel
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