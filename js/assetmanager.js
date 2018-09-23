(function(exports){
    if (typeof window === 'undefined'){
        // imports for node
        Category = require('./category')
        Author = require('./author')
        Spritesheet = require('./spritesheet')
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
            this.generalAnimations = {};
        }

        //load tileset via AJAX
        loadTsx (path, palette, nameOverride) {
            this.increasePending();
            let dirArr = path.split('/');
            dirArr.pop();
            let dirPath = dirArr.join('/');
            let that = this;
            let fullPath = this.baseDir + path
            tools.loadXML(fullPath, function(response) {
                let tileset = response.getElementsByTagName('tileset')[0];
                let image = response.getElementsByTagName('image')[0];
                let name = tileset.getAttribute('name');
                let tileHeight = parseInt(tileset.getAttribute('tileheight'), 10);
                let tileWidth = parseInt(tileset.getAttribute('tilewidth'), 10);
                let src = dirPath + '/' + image.getAttribute('source');
                let height = parseInt(image.getAttribute('height'), 10);
                let width = parseInt(image.getAttribute('width'), 10);
                //new Animation(this.generalAnimations, response.getElementsByTagName('tile'))
                let properties = response.getElementsByTagName('properties')[0].getElementsByTagName('property');
                let tiles = response.getElementsByTagName('tile');
                //initialized
                let attributes = {layer: 0, author: 'unknown', category: 'uncategorized', sex: 0, license: 'unknown', url: '', incomplete: 0};
                let animations = that.generalAnimations;
                //parse all custom properties
                for(let i = 0; i < properties.length; i++){
                    let child = properties[i];
                    if(child.hasAttribute('name') && child.hasAttribute('value')){
                        attributes[child.getAttribute('name')] = child.getAttribute('value');
                    }
                }
                //adjust max and min layer
                if(attributes['layer'] > that.layers.max)
                    that.layers.max = attributes['layer'];
                if(attributes['layer'] < that.layers.min)
                    that.layers.min = attributes['layer'];
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
                    if(direction >= 0 && animation != ''){
                        if(animations[animation]){
                            let anim = animations[animation]
                            //create mapping object if missing
                            if(!anim.mapping)
                                anim.mapping = [];
                            if(!anim.mapping[direction])
                                anim.mapping[direction] = [];
                            if(frame == -1){
                                for(let j = 0; j < anim.frames; j++){
                                    //don’t overwrite previous mappings
                                    if(!anim.mapping[direction][j])
                                    anim.mapping[direction][j] = id+j;
                                }
                            }
                        }
                    }
                }
                let tmpSprite = new Spritesheet((nameOverride ? nameOverride : name), src, width, height, tileWidth, tileHeight, attributes, palette, undefined, that, animations);
                //manage categories
                let categories = attributes['category'].split(';');
                //go through all categories and add them if neccessary
                let lastCat = that.categories;
                for (let i in categories) {
                    if (!lastCat.hasCategory(categories[i])) {
                        lastCat.addCategory(categories[i]);
                    }
                    lastCat = lastCat.getCategory(categories[i]);
                }
                //add sprite to latest category
                lastCat.addSprite(tmpSprite);
        
                //manage authors
                let authors = attributes['author'].split(';');
                for (let i in authors){
                    //create if doesn’t exist
                    if(!that.authors[authors[i]]){
                        that.loadAuthor(authors[i], tmpSprite);
                    } else {
                        that.authors[authors[i]].addSprite(tmpSprite);
                    }
                }
                that.decreasePending(path);
            })
        }

        //load author via AJAX
        loadAuthor (name, sprite) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + 'authors/' + name + '.json'
            tools.loadPlain(fullPath, function(response){
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
            tools.loadPlain(fullPath, function(response){
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

        //load sprite list via AJAX
        loadGeneralAnimations (path) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + path;
            tools.loadPlain(fullPath, function(response){
                //convert to json and iterate through the array
                that.generalAnimations = JSON.parse(response);
                that.decreasePending(fullPath);
            })
        }

        //load sprite list via AJAX
        loadList (path) {
            this.increasePending();
            let that = this;
            let fullPath = this.baseDir + path + 'list.json';
            tools.loadPlain(fullPath, function(response){
                //convert to json and iterate through the array
                var list = JSON.parse(response);
                for (let i in list) {
                    let filePath = path + (list[i].file ? list[i].file : list[i])
                    //check file extensions
                    if (filePath.split('.').pop() == 'tsx') {
                        //allow objects for tsx files 
                        //for palette changing
                        that.loadTsx(filePath, list[i].palette, list[i].name);
                    }
                    if (filePath[filePath.length - 1] == '/') {
                        that.loadList(filePath);
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
            if(this.pending <= 0)
                this.onLoad();
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