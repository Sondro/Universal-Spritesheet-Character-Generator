class LpcGenerator {
    constructor(character){
        this.character = character;
        this.counter = 0;
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
        this.character.redraw();
        let drawn = this.character.img;
        canvas.width = drawn.width;
        canvas.height = drawn.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(drawn, 0, 0);
    }

    generateAttribution(syntax){
        let attribution = document.getElementById('attribution').getElementsByClassName('attribution')[0];
        attribution.innerHTML = this.character.generateAttribution('html');
    }

    animate(){
        let canvas = document.getElementById('previewAnimations');
        let spritesheet = document.getElementById('spritesheet');
        let ctx = canvas.getContext('2d');
        let selector = document.getElementById('whichAnim');
        if(selector.selectedIndex >= 0 && this.character.tileWidth > 0 && this.character.tileHeight > 0){
            let selected = selector.options[selector.selectedIndex].value;
            let animation = assetManager.generalAnimations[selected];
            if(animation){
                canvas.width = this.character.tileWidth * animation.directions;
                canvas.height = this.character.tileHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let position = this.counter%animation.frames;
                let x = position * this.character.tileWidth;
                for(let i = 0; i < animation.directions; i++){
                    let y = (i+animation.row) * this.character.tileHeight;
                    ctx.drawImage(spritesheet, x, y, this.character.tileWidth, this.character.tileHeight, i * this.character.tileWidth, 0, this.character.tileWidth, this.character.tileHeight);
                }
            }else{
                canvas.width = canvas.height = 1;
            }
            this.counter++;
        }else{
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        let that = this;
        window.setTimeout(function(){that.animate()}, 1000/8)
    }

    updateGui(){
        let mainList = document.getElementById('chooser').getElementsByTagName('ul')[0];
        let selector = document.getElementById('whichAnim');
        let selected = assetManager.defaultAnimation;
        if(selector.selectedIndex >= 0)
            selected = selector.options[selector.selectedIndex].value;
        //remove all children but those in the 'keep' class
        while (mainList.lastChild && (!mainList.lastChild.className || !mainList.lastChild.className.match(/.*keep.*/) )) {
            mainList.removeChild(mainList.lastChild)
        }
        while (selector.lastChild) {
            selector.removeChild(selector.lastChild)
        }
        let mainCategories = assetManager.categories.getCategories();
        for (let i in mainCategories) {
            this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
        }
        for (let animation in assetManager.generalAnimations){
            let option = document.createElement('option');
            option.value = animation;
            option.innerText = assetManager.generalAnimations[animation].name;
            if(animation == selected)
                option.selected = 'selected';
            selector.appendChild(option);
        }
        this.drawCanvas();
        this.generateAttribution();
    }

    onLoad(){
        let lpcGenerator = this;
        document.getElementById('loading').innerText = 'loading...';
        document.addEventListener('click', function(ev){
            if(ev.target.type == 'button' && ev.target.innerHTML == 'Reset all'){
                lpcGenerator.updateGui();
            }
            if(ev.target.nodeName == 'INPUT' && ev.target.type == 'radio'){
                //iterate through all categories
                let mainCategories = assetManager.categories.getCategories();
                let selection = 'sex=' + document.querySelector('input[name="sex"]:checked').value;
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
        assetManager.onLoad = function(){
            jHash.change(function() {
                lpcGenerator.character.setSelection(jHash.val());
                lpcGenerator.updateGui();
            });
            lpcGenerator.character.setSelection(jHash.val());
            lpcGenerator.updateGui();
            document.getElementById('loading').className = 'hidden';
            document.getElementById('generator').className = '';
        }
        assetManager.onProgress = function(pending, allFiles, lastPath){
            document.getElementById('loading').innerText = 'loading... (' + (allFiles - pending) + '/' + allFiles + ')';
        }
        assetManager.loadList('spritesheets/');
        this.animate();
    }
}