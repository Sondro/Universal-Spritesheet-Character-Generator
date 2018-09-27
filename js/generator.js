class LpcGenerator {
    constructor(character) {
        this.character = character;
        this.counter = 0;
    }

    drawSprite(parent, mainCat, spriteset) {
        let li = document.createElement('li');
        let input = document.createElement('input');
        input.name = mainCat;
        //assume 'none' option if invalid spriteset
        if (spriteset) {
            let categoryHandle = spriteset[0].category.join('.');
            input.value = categoryHandle + '.' + spriteset[0].name;
            //check if this was enabled
            if (this.character.selection[mainCat] && this.character.selection[mainCat].join('.') == input.value) {
                input.checked = 'checked';
            }
        } else {
            input.value = 'none';
            //choose none is nothing is set
            if (!this.character.selection[mainCat]) {
                input.checked = 'checked';
            }
        }
        input.type = 'radio'
        let label = document.createElement('label');
        label.appendChild(input);
        let preview = this.character.exportPreview(spriteset);
        preview.className = 'preview';
        label.appendChild(preview);
        let name = 'None';
        if (spriteset) {
            name = spriteset[0].name.replace('_', ' ');
            //capitalize first character
            name = name.charAt(0).toUpperCase() + name.substring(1)
        }
        label.appendChild(document.createTextNode(name));
        li.appendChild(label);
        //assume 'none' option if invalid spriteset
        if (spriteset) {
            let matchAll = false;
            //check if sprite is compatable with filters
            for (let i in spriteset) {
                let sprite = spriteset[i];
                let match = true
                for (let filter in assetManager.filters) {
                    match = match && assetManager.filters[filter].match(sprite, this.character.selection);
                }
                matchAll = matchAll || match;
            }
            //only show if filters match
            if (matchAll) {
                parent.appendChild(li);
            } else if (input.checked) {
                //check none if this was checked
                document.querySelector('input[name="' + mainCat + '"][value="none"]').checked = 'checked';
            }
        } else {
            parent.appendChild(li);
        }
    }

    //generate html list for category recursively
    drawCategory(parent, mainCat, category) {
        let li = document.createElement('li');
        let ul = document.createElement('ul');
        ul.style = 'display:block;'
        let span = document.createElement('span');
        let name = category.name.replace('_', ' ');
        //capitalize first character
        name = name.charAt(0).toUpperCase() + name.substring(1);
        span.appendChild(document.createTextNode(name));
        span.className = 'expanded';
        li.appendChild(span);
        li.appendChild(ul);
        if (mainCat == category.name) {
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
        for (let i in children) {
            this.drawCategory(ul, mainCat, children[i])
        }
        //hide empty categories
        if (ul.childElementCount == 0) {
            parent.removeChild(li);
        }
        //hide main categories that only contain none
        if (ul.childElementCount == 1 && mainCat == category.name) {
            parent.removeChild(li);
        }
    }

    drawCanvas() {
        let canvasContainer = document.getElementById('spritesheet');
        //remove all children but those in the 'keep' class
        while (canvasContainer.lastChild) {
            canvasContainer.removeChild(canvasContainer.lastChild)
        }
        this.character.redraw();
    
        for(let a in this.character.animations){
            let anim = this.character.animations[a];
            if(anim.height > 0 && anim.width){
                canvasContainer.appendChild(anim)
            }
        }
    }

    generateAttribution(syntax) {
        let attribution = document.getElementById('attribution').getElementsByClassName('attribution')[0];
        attribution.innerHTML = this.character.generateAttribution('html');
    }

    animate() {
        let canvas = document.getElementById('previewAnimations');
        let ctx = canvas.getContext('2d');
        let selector = document.getElementById('whichAnim');
        if (selector.selectedIndex >= 0) {
            let selected = selector.options[selector.selectedIndex].value;
            let animation = assetManager.generalAnimations[selected];
            if (animation) {
                let spritesheet = this.character.animations[selected];
                let tileHeight = spritesheet.height / animation.directions;
                let tileWidth = spritesheet.width / animation.frames;
                canvas.width = tileWidth * animation.directions;
                canvas.height = tileHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let position = this.counter % animation.frames;
                let x = position * tileWidth;
                for (let i = 0; i < animation.directions; i++) {
                    let y = i * tileHeight;
                    ctx.drawImage(spritesheet, x, y, tileWidth, tileHeight, i * tileWidth, 0, tileWidth, tileHeight);
                }
            } else {
                canvas.width = canvas.height = 1;
            }
            this.counter++;
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        let that = this;
        window.setTimeout(function () { that.animate() }, 1000 / 8)
    }

    updateGui() {
        let mainList = document.getElementById('chooser').getElementsByTagName('ul')[0];
        let selector = document.getElementById('whichAnim');
        let selected = assetManager.defaultAnimation;
        if (selector.selectedIndex >= 0)
            selected = selector.options[selector.selectedIndex].value;
        //remove all children but those in the 'keep' class
        while (mainList.lastChild && (!mainList.lastChild.className || !mainList.lastChild.className.match(/.*keep.*/))) {
            mainList.removeChild(mainList.lastChild)
        }
        while (selector.lastChild) {
            selector.removeChild(selector.lastChild)
        }
        // set inputs for virtual categories of pure filters
        // real categories aren't added to html yet
        for (let s in this.character.selection) {
            // ignore flags like "&incompleteAnimations=true"
            if(this.character.selection[s] != 'true') {
                let value = this.character.selection[s].join('.');
                let radio = document.querySelector('input[name="' + s + '"][value="' + value + '"]')
                if (radio)
                    radio.checked = 'checked';
            }
        }
        let mainCategories = assetManager.categories.getCategories();
        for (let i in mainCategories) {
            this.drawCategory(mainList, mainCategories[i].name, mainCategories[i])
        }
        // animation selector depends on this
        this.drawCanvas();
        for (let animation in this.character.animations) {
            console.log(this.character.animations[animation].className)
            if (this.character.animations[animation].className != 'hidden') {
                let option = document.createElement('option');
                option.value = animation;
                option.textContent = assetManager.generalAnimations[animation].name;
                if (animation == selected)
                    option.selected = 'selected';
                selector.appendChild(option);
            }
        }
        this.generateAttribution();
    }

    onLoad() {
        let lpcGenerator = this;
        document.getElementById('loading').textContent = 'loading...';
        let buttons = document.getElementById('buttons');
        let clearButton = document.createElement('button');
        clearButton.textContent = 'Reset all';
        buttons.appendChild(clearButton);
        let switchButton = document.createElement('button');
        switchButton.textContent = 'Show attributions';
        buttons.appendChild(switchButton);
        document.addEventListener('click', function (ev) {
            if (ev.target.textContent == 'Reset all') {
                window.location = '#'
            }
            if (ev.target.textContent == 'Show attributions') {
                ev.target.textContent = 'Show spritesheet';
                document.getElementById('attribution').className = '';
                document.getElementById('preview').className = 'hidden';
            } else if (ev.target.textContent == 'Show spritesheet') {
                ev.target.textContent = 'Show attributions';
                document.getElementById('preview').className = '';
                document.getElementById('attribution').className = 'hidden';
            }
            if (ev.target.nodeName == 'INPUT' && ev.target.type == 'radio') {
                //iterate through all categories
                let mainCategories = assetManager.categories.getCategories();
                let selection = '';
                // get values for filters with no coresponding real category
                for (let f in assetManager.filters) {
                    // category means they will be handled by the category loop
                    if (!assetManager.filters[f].category) {
                        let unknown = true;
                        for (let cat of mainCategories) {
                            if (cat.name == f)
                                unknown = false;
                        }
                        if (unknown) {
                            let radio = document.querySelector('input[name="' + f + '"]:checked');
                            if (radio && radio.value != 'none') {
                                if (selection != '')
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
                    if (radio && radio.value != 'none') {
                        if (selection != '')
                            selection += '&';
                        selection += name + '=' + radio.value;
                    }
                }
                window.location = '#?' + selection;
            }
        });
        assetManager.onLoad = function () {
            jHash.change(function () {
                lpcGenerator.character.setSelection(jHash.val());
                lpcGenerator.updateGui();
            });
            lpcGenerator.character.setSelection(jHash.val());
            lpcGenerator.updateGui();
            document.getElementById('loading').className = 'hidden';
            document.getElementById('generator').className = '';
        }
        assetManager.onProgress = function (pending, allFiles, lastPath) {
            document.getElementById('loading').textContent = 'loading... (' + (allFiles - pending) + '/' + allFiles + ')';
        }
        assetManager.loadGeneralAnimations('animations.json');
        assetManager.loadFilters('filters.json');
        assetManager.loadList('spritesheets/');
        this.animate();
    }
}