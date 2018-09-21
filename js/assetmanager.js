(function(exports){
    if (typeof window === 'undefined'){
        // imports for node
        Category = require('./category')
        Author = require('./author')
        Spritesheet = require('./spritesheet')
        tools = require('./tools')
    }
    class AssetManager {

        constructor(){
            this.categories = new Category('all');
            this.authors = {};
            this.animations = [];
            this.layers = {min: 0, max: 0};
            this.pending = 0;
            this.onLoad = function(){}
        }

        //load tileset via AJAX
        loadTsx (path, palette, nameOverride) {
            this.pending++;
            let dirArr = path.split('/');
            dirArr.pop();
            let dirPath = dirArr.join('/');
            let that = this;
            tools.loadXML(path, function(response) {
                let tileset = response.getElementsByTagName('tileset')[0];
                let image = response.getElementsByTagName('image')[0];
                let name = tileset.getAttribute('name');
                let src = dirPath + '/' + image.getAttribute('source');
                let height = image.getAttribute('height');
                let width = image.getAttribute('width');
                let properties = response.getElementsByTagName('properties')[0];
                //initialized
                let attributes = {layer: 0, author: 'unknown', category: 'uncategorized', sex: 0, license: 'unknown', url: '', incomplete: 0};
                //parse all custom properties
                for (let i in properties.children) {
                    if( properties.children[i].hasAttribute){
                        attributes[properties.children[i].getAttribute('name')] = properties.children[i].getAttribute('value');
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
                let tmpSprite = new Spritesheet((nameOverride ? nameOverride : name), src, width, height, attributes, palette);
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
                //TODO: find better way
                //that.updateGui();
                that.decreasePending();
            })
        }

        //load author via AJAX
        loadAuthor (name, sprite) {
            this.pending++;
            let that = this;
            tools.loadPlain('authors/' + name + '.json', function(response){
                //convert to json and iterate through the array
                var author = JSON.parse(response);
                if(!that.authors[name])
                    that.authors[name] = new Author(author.name, author.url);
                that.authors[name].addSprite(sprite);
                that.decreasePending();
            })
        }

        //load gimp palette .gpl
        loadPalette (path, callback) {
            this.pending++;
            let that = this;
            tools.loadPlain('palettes/' + path + '.gpl', function(response){
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
                that.decreasePending();
            })
        }

        //load sprite list via AJAX
        loadList (path) {
            this.pending++;
            let that = this;
            tools.loadPlain(path + 'list.json', function(response){
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
                that.decreasePending();
            })
        }

        decreasePending(){
            this.pending--;
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