document.addEventListener('click', function(ev){
    console.log(ev);
    if(ev.target.type == 'button' && ev.target.innerHTML == 'Reset all'){
        lpcGenerator.updateGui();
    }
    if(ev.target.nodeName == 'INPUT' && ev.target.type == 'radio'){
        //iterate through all categories
        let mainCategories = lpcGenerator.categories.getCategories();
        selection = "";
        for (let i in mainCategories) {
            //this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
            name = mainCategories[i].name;
            let radio = document.querySelector('input[name="' + name + '"]:checked');
            if(radio && radio.value != 'none'){
                if(selection != "")
                    selection += "&";
                selection += name + '=' + radio.value;
            }else{
                console.log('input[name="' + name + '"]:checked not found');
            }
        }
        console.log(selection);
        window.location = '#?' + selection
        lpcGenerator.drawCanvas();
    }
});

function getSelection(){
    
}

//class for spritesheets
class Spritesheet {
    constructor(name, src, width, height, attributes = {}){
        this.name = name;
        this.src = src;
        this.layer = attributes['layer'];
        this.category = attributes['category'].split(';');
        this.author = attributes['author'].split(';');
        this.sex = attributes['sex'];
        this.license = attributes['license'].split(';');
        this.url = attributes['url'];
        this.img = new Image(width, height);
        this.img.src = src;
        this.img.onload = function(){lpcGenerator.updateGui};
    }
}

class Category {
    constructor(name) {
        this.name = name;
        this.subcategories = [];
        this.sprites = [];
    }

    hasCategory(name) {
        for (let i in this.subcategories)
            if (this.subcategories[i].name == name)
                return true;
        return false;
    }

    getCategory(name) {
        for (let i in this.subcategories)
            if (this.subcategories[i].name == name)
                return this.subcategories[i];
    }

    getCategories() {
        return this.subcategories;
    }

    addCategory(name) {
        this.subcategories.push(new Category(name));
    }

    hasSpriteset(name) {
        for (let i in this.sprites)
            if (this.sprites[i][0].name == name)
                return true;
        return false;
    }

    getSpriteset(name) {
        for (let i in this.sprites)
            if (this.sprites[i][0].name == name)
                return this.sprites[i];
    }

    getSpritesets() {
        return this.sprites;
    }

    //add to existing set or create new one
    addSprite(sprite) {
        for (let i in this.sprites){
            if (this.sprites[i][0].name == sprite.name){
                this.sprites[i].push(sprite);
                return;
            }
        }
        this.sprites.push([sprite]);
    }
}

class Author {

    constructor(name, url){
        this.name = name;
        this.url = url;
        this.sprites = []
    }

    addSprite(ss){
        this.sprites.push(ss);
    }
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
        label.appendChild(document.createTextNode(spriteset ? spriteset[0].name : 'none'));
        li.appendChild(input);
        li.appendChild(label);
        parent.appendChild(li);
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
        let sprites = category.getSpritesets();
        for (let i in sprites) {
            this.drawSprite(ul, mainCat, sprites[i])
        }
        let children = category.getCategories();
        for (let i in children) {            //TODO: load author JSON
            this.drawCategory(ul, mainCat, children[i])
        }
        //delay browser rendering as much as possible
        parent.appendChild(li);
    }

    drawCanvas(){
        let ctx = document.getElementById('spritesheet').getContext('2d');
/*         console.log(this.categories.getCategory('body').getSpriteset('white')[0].img.complete)
        console.log(this.categories.getCategory('body').getSpriteset('white')[0].img.src)
        ctx.drawImage(this.categories.getCategory('body').getSpriteset('white')[0].img,0,0) */

/*         for(let i = this.layers.min; i <= this.layers.max; i++){

        } */
        let hash = jHash.val();//.split('.');
        for (let i in hash){
            let category = decodeURI(hash[i]).split('.');
            let name = category.pop();
            let lastCat = this.categories;
            for (let j in category) {
                    lastCat = lastCat.getCategory(category[j]);
            }
            console.log(lastCat.getSpriteset(name)[0]);
            ctx.drawImage(lastCat.getSpriteset(name)[0].img,0,0)
        }
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
    }

    //load tileset via AJAX
    loadTsx (path) {
        let req = new XMLHttpRequest();
        let dirArr = path.split('/');
        dirArr.pop();
        let dirPath = dirArr.join('/');
        let that = this;
        req.addEventListener('load', function() {
            let tileset = this.responseXML.getElementsByTagName('tileset')[0];
            let image = this.responseXML.getElementsByTagName('image')[0];
            let name = tileset.getAttribute('name');
            let src = dirPath + '/' + image.getAttribute('source');
            let height = image.getAttribute('height');
            let width = image.getAttribute('width');
            let properties = this.responseXML.getElementsByTagName('properties')[0];
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
            
            let tmpSprite = new Spritesheet(name, src, width, height, attributes);
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
        req.open('GET', path);
        req.responseType = 'document';
        req.overrideMimeType('text/xml');
        req.send();
    }

    //load author via AJAX
    loadAuthor (name, sprite) {
        let req = new XMLHttpRequest();
        req.open('GET', 'authors/' + name + '.json');
        req.responseType = 'text';
        req.overrideMimeType('text/json');
        let that = this;
        req.addEventListener('load', function(){
            //convert to json and iterate through the array
            var author = JSON.parse(this.responseText);
            if(!that.authors[name])
                that.authors[name] = new Author(author.name, author.url);
            that.authors[name].addSprite(sprite);
        })
        req.send();
    }

    //load sprite list via AJAX
    loadList (path) {
        let req = new XMLHttpRequest();
        req.open('GET', path + 'list.json');
        req.responseType = 'text';
        req.overrideMimeType('text/json');
        let that = this;
        req.addEventListener('load', function(){
            //convert to json and iterate through the array
            var list = JSON.parse(this.responseText);
            for (let i in list) {
                //check file extensions
                if (list[i].split('.').pop() == 'tsx') {
                    that.loadTsx(path + list[i]);
                }
                if (list[i][list[i].length - 1] == '/') {
                    that.loadList(path + list[i]);
                }
                //ignore exerything else
            }
        })
        req.send();
    }
}

window.lpcGenerator = new LpcGenerator();
window.onload=function (){
    lpcGenerator.loadList('spritesheets/');
    console.log(jHash.val());
    jHash.change(function() {
        lpcGenerator.drawCanvas();
    });
};