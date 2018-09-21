document.addEventListener('click', function(ev){
    if(ev.target.type == 'button' && ev.target.innerHTML == 'Reset all'){
        lpcGenerator.updateGui();
    }
    if(ev.target.nodeName == 'INPUT' && ev.target.type == 'radio'){
        //iterate through all categories
        let mainCategories = assetManager.categories.getCategories();
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
    constructor(character){
        this.categories = new Category('all');
        this.animations = [];
        this.authors = {};
        this.layers = {min: 0, max: 0}
        this.character = character;
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
                if(sprite.sex == 0 || sprite.sex & this.character.getSex()){
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
        ctx.drawImage(this.character.draw(), 0, 0);
    }

    generateAttribution(){
        let attribution = document.getElementById('attribution');
        let tmpAttr = "";
        let layers = this.character.getLayers().layers;
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
                    let author = assetManager.authors[sprite.author[a]];
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

    updateGui(){
        let mainList = document.getElementById('chooser').getElementsByTagName('ul')[0];
        //remove all children but those in the 'keep' class
        while (mainList.lastChild && (!mainList.lastChild.className || !mainList.lastChild.className.match(/.*keep.*/) )) {
            mainList.removeChild(mainList.lastChild)
        }
        let mainCategories = assetManager.categories.getCategories();
        for (let i in mainCategories) {
            this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
        }
        this.drawCanvas();
        this.generateAttribution();
    }

  
}

window.onload=function (){
    lpcGenerator = new LpcGenerator(new Character(jHash.val()));
    assetManager.onLoad = function(){
        lpcGenerator.character.setSelection(jHash.val());
        lpcGenerator.updateGui();
        document.getElementById('loading').className = 'hidden';
        document.getElementById('generator').className = '';
    }
    assetManager.loadList('spritesheets/');
    lpcGenerator.updateGui();
    jHash.change(function() {
        lpcGenerator.character.setSelection(jHash.val());
        lpcGenerator.updateGui();
    });
};