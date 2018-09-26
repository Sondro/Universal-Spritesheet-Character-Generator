(function(exports){
    if (typeof window === 'undefined'){
        // imports for node
        Category = require('./category')
        Author = require('./author')
        Spritesheet = require('./spritesheet')
        Filter = require('./filter')
        tools = require('./tools')
        XMLSerializer = require('xmldom').XMLSerializer;
    }
    let xs = new XMLSerializer();
    class AssetManager {

        constructor(){
            this.categories = new Category('all');
            this.authors = {};
            this.animations = [];
            this.layers = {min: 0, max: 0};
            this.pending = 0;
            this.allFiles = 0;
            this.onLoad = function(){}
            this.onProgress = function(pending, allFiles, lastPath){}
            this.baseDir = './';
            this.filters = {};
            this.generalAnimations = {};
            this.defaultAnimation = '';
            // "cheats"
            this.ignoreFilter = false;
            this.ignoreMandatory = false;
            this.incompleteAnimations = false;
            // for caching files
            this.cache = {}
        }


        //load tileset via AJAX
        loadTsx (path, override={}) {
            this.increasePending();
            let dirArr = path.split('/');
            dirArr.pop();
            let dirPath = dirArr.join('/');
            let that = this;
            let fullPath = this.baseDir + path
            tools.loadXML(fullPath, this.cache, function(response) {

                let properties = response.getElementsByTagName('properties')[0].getElementsByTagName('property');
                let animationReference = "";
                //parse all custom properties
                for(let i = 0; i < properties.length; i++){
                    let child = properties[i];
                    if(child.hasAttribute('name') && child.hasAttribute('value')){
                        if(child.getAttribute('name') == 'animation')
                            animationReference = child.getAttribute('value');
                    }
                }
                if(animationReference == ""){
                    let tiles = response.getElementsByTagName('tile');
                    that.loadTsxParser(path, dirPath, override, response, tiles);
                }else{
                    that.increasePending();
                    fullPath = that.baseDir + dirPath + '/' + animationReference;
                    tools.loadXML(fullPath, that.cache, function(resp) {
                        let tiles = resp.getElementsByTagName('tile');
                        // since nested always pending > 1
                        that.decreasePending(animationReference);
                        that.loadTsxParser(path, dirPath, override, response, tiles);
                    })
                }
            })
        }

        loadTsxParser (path,  dirPath, override, xml, tiles) {
            let that = this;
            let tileset = xml.getElementsByTagName('tileset')[0];
            let image = xml.getElementsByTagName('image')[0];
            let name = (override.name ? override.name : tileset.getAttribute('name'))
            let tileHeight = parseInt(tileset.getAttribute('tileheight'), 10);
            let tileWidth = parseInt(tileset.getAttribute('tilewidth'), 10);
            let src = dirPath + '/' + image.getAttribute('source');
            let height = parseInt(image.getAttribute('height'), 10);
            let width = parseInt(image.getAttribute('width'), 10);
            //new Animation(this.generalAnimations, xml.getElementsByTagName('tile'))
            let properties = xml.getElementsByTagName('properties')[0].getElementsByTagName('property');
            //initialized
            let attributes = {layer: 0, author: 'unknown', category: 'uncategorized', sex: 0, license: 'unknown', url: '', incomplete: 0};
            let animations = {};
            //parse all custom properties
            for(let i = 0; i < properties.length; i++){
                let child = properties[i];
                if(child.hasAttribute('name') && child.hasAttribute('value')){
                    if(child.getAttribute('name').startsWith('filter_')){
                        if(!attributes.filters)
                            attributes.filters = {};
                        let name = child.getAttribute('name').substring('filter_'.length)
                        attributes.filters[name] = child.getAttribute('value');
                    }else{
                        attributes[child.getAttribute('name')] = child.getAttribute('value');
                    }
                }
            }
            // override attributes
            for(let attr of ['layer', 'category', 'incomplete']){
                if(override[attr])
                    attributes[attr] = override[attr];
            }
            // override filters
            if(override.filters){
                for(let i in override.filters)
                    attributes.filters[i] = override.filters[i];
            }
            //adjust max and min layer
            if(attributes['layer'] > this.layers.max)
                this.layers.max = attributes['layer'];
            if(attributes['layer'] < this.layers.min)
                this.layers.min = attributes['layer'];
            //don't load incomplete spritesheets
            if(attributes['incomplete'] == 'true')
                return;
            //parse all tile properties
            for(let i = 0; i < tiles.length; i++){
                let tile = tiles[i];
                let id = parseInt(tile.getAttribute('id'), 10);
                let animation = '';
                let direction = -1;
                let frame = -1
                let properties = tile.getElementsByTagName('property')
                for(let j = 0; j < properties.length; j++){
                    let child = properties[j];
                    if(child.hasAttribute('name') && child.hasAttribute('value')){
                        let value = child.getAttribute('value');
                        switch(child.getAttribute('name')){
                            case 'animation':
                                animation = value;
                                break
                            case 'direction':
                                direction = parseInt(value, 10);
                                break
                            case 'frame':
                                frame = parseInt(value, 10);
                                break
                        }
                    }
                }
                // skip tiles with incomplete properties
                if(direction >= 0 && animation != '' && this.generalAnimations[animation]){
                    if(!animations[animation]){
                        animations[animation] = {} 
                    }
                    let anim = animations[animation]
                    //create mapping object if missing
                    if(!anim.mapping)
                        anim.mapping = [];
                    if(!anim.mapping[direction])
                        anim.mapping[direction] = [];
                    if(frame == -1){
                        for(let j = 0; j < this.generalAnimations[animation].frames; j++){
                            //don’t overwrite previous mappings
                            if(!anim.mapping[direction][j])
                                anim.mapping[direction][j] = id+j;
                        }
                    }else{
                        anim.mapping[direction][frame] = id;
                    }
                }
            }
            //manage categories
            let categories = attributes['category'].split(';');
            //go through all categories and add them if neccessary
            let lastCat = this.categories;
            for (let i in categories) {
                if (!lastCat.hasCategory(categories[i])) {
                    lastCat.addCategory(categories[i]);
                }
                lastCat = lastCat.getCategory(categories[i]);
            }
            let tmpSprite = new Spritesheet(name, src, width, height, tileWidth, tileHeight, attributes, override.palette, function(){that.decreasePending(path)}, this, animations);
            //add sprite to latest category
            lastCat.addSprite(tmpSprite);
            //manage authors
            let authors = attributes['author'].split(';');
            for (let i in authors){
                //create if doesn’t exist
                if(!this.authors[authors[i]]){
                    this.loadAuthor(authors[i], tmpSprite);
                } else {
                    this.authors[authors[i]].addSprite(tmpSprite);
                }
            }
        }

        //load author via AJAX
        loadAuthor (name, sprite) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + 'authors/' + name + '.json'
            tools.loadPlain(fullPath, this.cache, function(response){
                //convert to json and iterate through the array
                var author = JSON.parse(response);
                if(!that.authors[name])
                    that.authors[name] = new Author(author.name, author.url);
                that.authors[name].addSprite(sprite);
                that.decreasePending(fullPath);
            })
        }

        //load gimp palette .gpl
        loadPalette (path, callback) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + 'palettes/' + path + '.gpl';
            tools.loadPlain(fullPath, this.cache, function(response){
                let content = response.split("\n");
                let colors = [];
                for(let i in content){
                    // split at spaces
                    // amount of spaces is ignored
                    let line = content[i].trim().split(/\s+/);
                    //ignore everything that isn't a color
                    if(line[0] != 'GIMP' && line[0] != 'Name:' && line[0] != 'Columns:' && line[0][0] != '#' && line.length > 3){
                        let red = parseInt(line[0], 10);
                        let green = parseInt(line[1], 10);
                        let blue = parseInt(line[2], 10);
                        colors.push({red: red, green: green, blue: blue});
                    }
                }
                if(callback)
                    callback(colors);
                that.decreasePending(fullPath);
            })
        }

        //load animaton description via AJAX
        loadGeneralAnimations (path) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + path;
            tools.loadPlain(fullPath, this.cache, function(response){
                that.generalAnimations = JSON.parse(response);
                // take note of the rows of the animations
                let row = 0;
                for(let i in that.generalAnimations){
                    let animation = that.generalAnimations[i];
                    animation.row = row;
                    row += animation.directions;
                }
                that.decreasePending(fullPath);
            })
        }

        //load filter list via AJAX
        loadFilters (path) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + path;
            tools.loadPlain(fullPath, this.cache, function(response){
                let filters = JSON.parse(response);
                for(let filter of filters){
                    that.filters[filter.name] = new Filter(filter);
                }
                that.decreasePending(fullPath);
            })
        }

        //load sprite list via AJAX
        loadList (path, file = 'list.json', listOverride={}) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + path + file;
            tools.loadPlain(fullPath, this.cache, function(response){
                //convert to json and iterate through the array
                var list = JSON.parse(response);
                // list with meta data
                if(list.files){
                    // override whole list
                    for(let attr of ['name', 'category', 'layer', 'incomplete', 'filters']){
                        if(list[attr])
                            listOverride[attr] = list[attr];
                    }
                    list = list.files;
                }
                for (let i in list) {
                    let filePath = path + (list[i].file ? list[i].file : list[i])
                    // shallow copy
                    let override = Object.assign({}, listOverride);
                    // override specific entry
                    for(let attr of ['name', 'category', 'layer', 'incomplete', 'filters', 'palette']){
                        if(list[i][attr])
                            override[attr] = list[i][attr];
                    }
                    //check file extensions
                    if (filePath.split('.').pop() == 'tsx') {
                        //allow objects for tsx files 
                        //for palette changing
                        that.loadTsx(filePath, override);
                    }
                    if (filePath.split('.').pop() == 'json') {
                        let file = filePath.split('/').pop()
                        let path = filePath.replace(/\/[^\/]*$/mg,'/')
                        console.log(path, file)
                        that.loadList(path, file, override);
                    }
                    if (filePath[filePath.length - 1] == '/') {
                        that.loadList(filePath, 'list.json', override);
                    }
                    //ignore exerything else
                }
                that.decreasePending(fullPath);
            })
        }

        setBaseDir(baseDir){
            this.baseDir = baseDir;
        }

        increasePending(){
            this.pending++;
            this.allFiles++;
        }

        decreasePending(lastPath){
            this.pending--;
            this.onProgress(this.pending, this.allFiles, lastPath)
            if(this.pending <= 0){
                delete this.cache;
                this.onLoad();
            }
        }
    }
    
    if(typeof module !== 'undefined'){
        //node
        module.exports = new AssetManager();
    }else{
        // browser
        this['assetManager'] = new AssetManager();
    }
}());