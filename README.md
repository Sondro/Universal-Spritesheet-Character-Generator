Universal LPC Spritesheet Character Generator
=============================================

Based on [Universal LPC Spritesheet Generator](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator).

Try it out [here](https://basxto.github.io/Universal-LPC-Spritesheet-Character-Generator/).

## Goals

* Simplify attribution
* Find original uploads
* Use original uploads without edits
* Switch color paletts
* Preprocess in browser
* Easily preprocess in terminal or on a server

## CLI version
### Install system dependencies
#### Ubuntu
```
# apt-get install nodejs npm libpango1.0 libcairo2
```
#### Archlinux
```
# pacman -S nodejs npm pango cairo
```
### Install node.js dependencies
```
$ npm install
```


## Examples
https://basxto.github.io/Universal-LPC-Spritesheet-Character-Generator/#?sex=1&body=body.light&clothes=clothes.long%20sleeve%20shirt.brown&legs=legs.robe%20skirt&belts=belts.leather%20belt&hats=hats.leather%20cap&shoes=shoes.brown%20shoes

```
./cli.js example.png --sex=1 --body="body.light" --clothes="clothes.long sleeve shirt.brown" --legs=legs.robe%20skirt --belts="belts.leather%20belt" --hats="hats.leather cap" --shoes=shoes.brown%20shoes
```


## Known problems

* Addons, which prevent canvas finger printing, can destroy palette switching