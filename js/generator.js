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
            if(this.character.selection[mainCat] && this.character.selection[mainCat].join('.') == input.value){
                input.checked = 'checked';
            }
        } else {
            input.value = 'none';
            //choose none is nothing is set
            if(!this.character.selection[mainCat]){
                input.checked = 'checked';
            }
        }
        input.type = 'radio'
        let label = document.createElement('label');
        label.appendChild(input);
        let preview = this.character.exportPreview(spriteset);
        preview.className = 'preview';
        label.appendChild(preview);
        label.appendChild(document.createTextNode(spriteset ? spriteset[0].name : 'none'));
        li.appendChild(label);
        //assume 'none' option if invalid spriteset
        if(spriteset){
            let matchAll = false;
            //check if sprite is compatable with filters
            for (let i in spriteset){
                let sprite = spriteset[i];
                let match = true
                for(let filter in assetManager.filters){
                    match = match && assetManager.filters[filter].match(sprite, this.character.selection);
                }
                matchAll = matchAll || match;
            }
            //only show if filters match
            if(matchAll){
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
        let layers = this.character.getLayers();
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
        // set inputs for virtual categories of pure filters
        // real categories aren't added to html yet
        for (let s in this.character.selection) {
            let value = this.character.selection[s].join('.');
            let radio = document.querySelector('input[name="' + s + '"][value="' + value + '"]')
            if(radio)
                radio.checked = 'checked';
        }
        let mainCategories = assetManager.categories.getCategories();
        for (let i in mainCategories) {
            this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
        }
        //let radio = document.querySelector('input[name="' + f + '"]:checked')
        for (let animation in assetManager.generalAnimations){
            if(layers.animations[animation]){
                let option = document.createElement('option');
                option.value = animation;
                option.innerText = assetManager.generalAnimations[animation].name;
                if(animation == selected)
                    option.selected = 'selected';
                selector.appendChild(option);
            }
        }
        this.drawCanvas();
        this.generateAttribution();
    }

    onLoad(){
        let lpcGenerator = this;
        document.getElementById('loading').innerText = 'loading...';
        let buttons = document.getElementsByClassName('buttons')[0];
        let clearButton = document.createElement('button');
        clearButton.innerText = 'Reset all';
        buttons.appendChild(clearButton);
        document.addEventListener('click', function(ev){
            if(ev.target.innerText == 'Reset all'){
                window.location = '#'
            }
            if(ev.target.nodeName == 'INPUT' && ev.target.type == 'radio'){
                //iterate through all categories
                let mainCategories = assetManager.categories.getCategories();
                let selection = '';
                // get values for filters with no coresponding real category
                for (let f in assetManager.filters) {
                    // category means they will be handled by the category loop
                    if(!assetManager.filters[f].category){
                        let unknown = true;
                        for(let cat of mainCategories){
                            if(cat.name == f)
                                unknown = false;
                        }
                        if(unknown){
                            let radio = document.querySelector('input[name="' + f + '"]:checked');
                            if(radio && radio.value != 'none'){
                                if(selection != '')
                                    selection += '&';
                                selection += f + '=' + radio.value;
                            }
                        }
                    }
                }
                // get values of real categories
                for (let i in mainCategories) {
                    //this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
                    name = mainCategories[i].name;
                    let radio = document.querySelector('input[name="' + name + '"]:checked');
                    if(radio && radio.value != 'none'){
                        if(selection != '')
                            selection += '&';
                        selection += name + '=' + radio.value;
                    }
                }
                window.location = '#?' + selection;
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
        assetManager.loadGeneralAnimations('animations.json');
        assetManager.loadFilters('filters.json');
        assetManager.loadList('spritesheets/');
        this.animate();
    }
}