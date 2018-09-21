#!/usr/bin/node
const fs = require('fs')
const path = require('path')
const Character = require('./js/character')
let assetManager = require('./js/assetmanager')

if(process.argv.length < 4){
    console.error('./cli.js <file.png> <configurations>...')
    process.exit(1);
}

function delayed(){
    let selection = {}
    for(let i = 3; i < process.argv.length; i++){
        let argument = process.argv[i];
        if(argument.startsWith('--') && argument != '--progress'){
            argument = argument.substring(2)
            let splitted = argument.split('=');
            selection[splitted[0]] = splitted[1];
        }
    }
    let c = new Character(selection, assetManager);
    let drawn = c.draw()
    let image = process.argv[2]
    if(!path.isAbsolute(image))
        image = path.join(__dirname, image);
    let out = fs.createWriteStream(image)
    out.write(drawn.toBuffer())
}

function progress(pending, allFiles, lastPath){
    console.log((allFiles-pending) + '/' + allFiles + ' loaded; latest: '+ lastPath)
}

let showProgress = false;
for(let i = 3; i < process.argv.length; i++){
    let arg = process.argv[i];
    if(arg == '--progress'){
        showProgress = true;
    }
}

assetManager.onLoad = delayed;
if(showProgress)
    assetManager.onProgress = progress;
assetManager.loadList('spritesheets/');