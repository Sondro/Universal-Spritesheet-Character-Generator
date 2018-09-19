document.addEventListener('click', function(ev){
    if(ev.target.type == 'button' && ev.target.innerHTML == 'Reset all'){
        lpcGenerator.updateGui();
    }
    if(ev.target.nodeName == 'INPUT' && ev.target.type == 'radio'){
        //iterate through all categories
        let mainCategories = lpcGenerator.categories.getCategories();
        selection = 'sex=' + document.querySelector('input[name="sex"]:checked').value;
        for (let i in mainCategories) {
            //this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
            name = mainCategories[i].name;
            let radio = document.querySelector('input[name="' + name + '"]:checked');
            if(radio && radio.value != 'none'){
                selection += '&';
                selection += name + '=' + radio.value;
            }
        }
        window.location = '#?' + selection
        lpcGenerator.drawCanvas();
    }
});

function getSelection(){
    
}

class LpcGenerator {
    constructor(){
        this.categories = new Category('all');
        this.animations = [];
        this.authors = {};
        this.layers = {min: 0, max: 0}
    }

    drawSprite(parent, mainCat, spriteset){
        let li = document.createElement('li');
        let input = document.createElement('input');
        input.name = mainCat;
        //assume 'none' option if invalid spriteset
        if(spriteset){
            let categoryHandle = spriteset[0].category.join('.');
            input.value = categoryHandle + '.' + spriteset[0].name;
            //check if this was enabled
            if(decodeURI(jHash.val(mainCat)) == input.value){
                input.checked = 'checked';
            }
        } else {
            input.value = 'none';
            //choose none is nothing is set
            if(!jHash.val(mainCat)){
                input.checked = 'checked';
            }
        }
        input.type = 'radio'
        let label = document.createElement('label');
        label.appendChild(input);
        label.appendChild(document.createTextNode(spriteset ? spriteset[0].name : 'none'));
        li.appendChild(label);
        //assume 'none' option if invalid spriteset
        if(spriteset){
            let validSex = false;
            //check if there is at least one sprite with valid sex in the set
            for (let i in spriteset){
                let sprite = spriteset[i];
                if(sprite.sex == 0 || sprite.sex & this.getSex()){
                    validSex = true;
                }
            }
            //only show if it can used for the current sex
            if(validSex){
                parent.appendChild(li);
            }else if(input.checked){
                //check none if this was checked
                document.querySelector('input[name="' + mainCat + '"][value="none"]').checked = 'checked';
            }
        }else{
            parent.appendChild(li);
        }
    }

    //generate html list for category recursively
    drawCategory(parent, mainCat, category){
        let li = document.createElement('li');
        let ul = document.createElement('ul');
        ul.style = 'display:block;'
        let span = document.createElement('span');
        span.appendChild(document.createTextNode(category.name));
        span.className = 'expanded';
        li.appendChild(span);
        li.appendChild(ul);
        if(mainCat == category.name){
            //create empty option
            this.drawSprite(ul, mainCat);
        }
        //musn't come last since hidden, but selected radios look for this element
        parent.appendChild(li);
        let sprites = category.getSpritesets();
        for (let i in sprites) {
            this.drawSprite(ul, mainCat, sprites[i])
        }
        let children = category.getCategories();
        for (let i in children) {            //TODO: load author JSON
            this.drawCategory(ul, mainCat, children[i])
        }
        //hide empty categories
        if(ul.childElementCount == 0){
            parent.removeChild(li);
        }
        //hide main categories that only contain none
        if(ul.childElementCount == 1 && mainCat == category.name){
            parent.removeChild(li);
        }
    }

    drawCanvas(){
        let canvas = document.getElementById('spritesheet');
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let layers = this.getLayers();
        for (let layer in layers){
            for (let sprite in layers[layer]){
                ctx.drawImage(layers[layer][sprite].img, 0, 0)
            }
        }
    }

    generateAttribution(){
        let attribution = document.getElementById('attribution');
        let tmpAttr = "";
        let layers = this.getLayers();
        for (let layer in layers){
            for (let i in layers[layer]){
                let sprite = layers[layer][i];
                tmpAttr += '<a href="' + sprite.src + '">' + sprite.src.split('/').pop() + '</a>'
                tmpAttr += ' licensced under '
                //link all licences
                for (let l in sprite.license){
                    if(l > 0)
                        tmpAttr += ', ';
                    tmpAttr += '<a href="'
                    switch(sprite.license[l].toLowerCase()){
                        case 'gnu gpl 2.0':
                            tmpAttr += 'https://www.gnu.org/licenses/gpl-2.0.en.html';
                            break;
                        case 'gnu gpl 3.0':
                            tmpAttr += 'https://www.gnu.org/licenses/gpl-3.0.en.html';
                            break;
                        case 'cc by-sa 3.0':
                            tmpAttr += 'https://creativecommons.org/licenses/by-sa/3.0/';
                            break;
                    }
                    tmpAttr += '">' + sprite.license[l] + '</a>'
                }
                tmpAttr += ' as <a href="' + sprite.url + '">' + sprite.title + '</a> by '
                //list all author to profile
                for (let a in sprite.author){
                    let author = this.authors[sprite.author[a]];
                    if(a > 0)
                        tmpAttr += ', ';
                    if(!author){
                        author = new Author(sprite.author[a], '');
                        tmpAttr += sprite.author[a];
                    }else{
                        tmpAttr += '<a href="' + author.url + '">' + author.name + '</a><br>';
                    }
                }
                tmpAttr += '<br>';
            }
        }
        attribution.innerHTML = tmpAttr;
    }

    getSex(){
        return jHash.val('sex') || 1;
    }

    //extract active layers from location bar
    getLayers(){
        let sprites = [];
        //extract used assets from location bar
        let hash = jHash.val();//.split('.');
        for (let i in hash){ if(i != 'sex'){
            let category = decodeURI(hash[i]).split('.');
            let name = category.pop();
            let lastCat = this.categories;
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
        for(let i = this.layers.min; i <= this.layers.max; i++){
            let newLayer = i + this.layers.min;
            layers[newLayer] = [];
            for(let j in sprites){
                if(sprites[j].layer == i)
                    layers[newLayer].push(sprites[j])
            }
        }
        return layers;
    }

    updateGui(){
        let mainList = document.getElementById('chooser').getElementsByTagName('ul')[0];
        //remove all children but those in the 'keep' class
        while (mainList.lastChild && (!mainList.lastChild.className || !mainList.lastChild.className.match(/.*keep.*/) )) {
            mainList.removeChild(mainList.lastChild)
        }
        let mainCategories = this.categories.getCategories();
        for (let i in mainCategories) {
            this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
        }
        this.drawCanvas();
        this.generateAttribution();
    }

    //load tileset via AJAX
    loadTsx (path, palette, nameOverride) {
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
            that.updateGui();
        })
    }

    //load author via AJAX
    loadAuthor (name, sprite) {
        let that = this;
        tools.loadPlain('authors/' + name + '.json', function(response){
            //convert to json and iterate through the array
            var author = JSON.parse(response);
            if(!that.authors[name])
                that.authors[name] = new Author(author.name, author.url);
            that.authors[name].addSprite(sprite);
        })
    }

    //load gimp palette .gpl
    loadPalette (path, callback) {
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
        })
    }

    //load sprite list via AJAX
    loadList (path) {
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
        })
    }
}

window.lpcGenerator = new LpcGenerator();
window.onload=function (){
    lpcGenerator.loadList('spritesheets/');
    jHash.change(function() {
        lpcGenerator.updateGui();
    });
};