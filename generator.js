paper.install(window);

//palettes for the big letters
var textPalettes = {
	'Wikidata': ['#990000', '#339966', '#006699'],
	'Sunset': ['#F94144', '#F3722C', '#F8961E', '#F9C74F'],
	'Ocean': ['#03045E', '#0077B6', '#00B4D8', '#90E0EF'],
	'Forest': ['#2D6A4F', '#40916C', '#74C69D', '#B7E4C7'],
	'Candy': ['#FF70A6', '#FF9770', '#FFD670', '#70D6FF'],
	'Neon': ['#F72585', '#7209B7', '#3A0CA3', '#4CC9F0'],
	'Pastel': ['#CDB4DB', '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF'],
	'Earth': ['#6B4226', '#8D5524', '#C68642', '#E0AC69'],
	'Mono light': ['#FFFFFF', '#D0D0CE'],
	'Mono dark': ['#222222', '#484848', '#777777']
};

//palettes for the background graphic
//background: page/export background, colors: shape colors, accent: details drawn on top of filled shapes
var graphicPalettes = {
	'Wikidata dark': {background: '#000000', colors: ['#FFFFFF'], accent: '#000000', twin: 'Wikidata light'},
	'Wikidata light': {background: '#FFFFFF', colors: ['#484848'], accent: '#FFFFFF', twin: 'Wikidata dark'},
	'Concrete': {background: '#D0D0CE', colors: ['#484848'], accent: '#D0D0CE'},
	'Ember': {background: '#1A1A1A', colors: ['#FE5000', '#FFB000', '#D0D0CE'], accent: '#1A1A1A'},
	'Midnight': {background: '#0B132B', colors: ['#5BC0BE', '#3A506B', '#6FFFE9'], accent: '#0B132B'},
	'Dusk': {background: '#22223B', colors: ['#9A8C98', '#C9ADA7', '#F2E9E4'], accent: '#22223B'},
	'Blueprint': {background: '#0D3B66', colors: ['#FAF0CA'], accent: '#0D3B66'},
	'Paper': {background: '#F4F1DE', colors: ['#E07A5F', '#3D405B', '#81B29A', '#F2CC8F'], accent: '#F4F1DE'},
	'Mint': {background: '#E9F5DB', colors: ['#718355', '#87986A', '#97A97C'], accent: '#E9F5DB'}
};

//palettes for the shapes of the background graphic
//includes the shape colors of every graphic palette plus some extra ones
var shapePalettes = {
	'White': ['#FFFFFF'],
	'Black': ['#000000'],
	'Grey': ['#484848'],
	'Wikidata': ['#990000', '#339966', '#006699'],
	'Gold': ['#FFB000', '#E09F3E', '#FFD166'],
	'Fire': ['#FE5000', '#F94144', '#FFB000'],
	'Ice': ['#E0FBFC', '#98C1D9', '#3D5A80'],
	'Rainbow': ['#F94144', '#F8961E', '#F9C74F', '#90BE6D', '#43AA8B', '#577590'],
	'Berry': ['#6A0572', '#AB83A1', '#D81E5B', '#F0C3D9'],
	'Retro': ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
	'Pastel': ['#CDB4DB', '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF'],
	'Neon': ['#F72585', '#7209B7', '#3A0CA3', '#4CC9F0']
};

var settings = {
	uppercase: true,
	textPalette: 'Wikidata',
	textColors: textPalettes['Wikidata'].slice(),
	letterMode: 'random', //random | cycle | single
	highlightCenter: true,
	showBlobTexts: true,
	blobTexts: [['WIKI', 'DATA'], ['BIRTH', 'DAY']],
	blobTextSize: 0.7,
	graphicPalette: 'Wikidata dark',
	background: '#000000',
	shapePalette: 'Wikidata dark',
	graphicColors: ['#FFFFFF'],
	accent: '#000000',
	graphicMode: 'mixed', //mixed | single
	exportBackground: false,
	transform: {
		graphic: {x: 0, y: 0, scale: 1, rotation: 0},
		text: {x: 0, y: 0, scale: 1, rotation: 0}
	}
};

var simText = "WIKIDATA";

var letters = [];
var blobs = [];
var lines = [];
var decos = [];
var centerLetter;
var textBlob = [];
var littleTexts = [];
var font;

var textGroup;
var graphicGroup;
var textBase;
var graphicBase;
var dragTarget = null;

window.onload = function() {
	paper.setup('paperCanvas');
	initUI();
	initDrag();

	generate();
}


function generate(){
	if(font){
		buildScene();
		return;
	}
	opentype.load("NotoSans-Bold.ttf", function(err, f) {
		if (err) {
			console.log(err.toString());
			return;
		}
		font = f;
		buildScene();
	});
}

function buildScene(){
	project.activeLayer.removeChildren();
	letters = [];
	graphicGroup = null;

	let textLines = simText.split(" ").filter(l => l.length > 0);
	textGroup = new Group();
	for(let i = 0; i<textLines.length; i++){
		let newline = textLine(textLines[i]);
		if(textGroup.lastChild){
			newline.bounds.topLeft = textGroup.lastChild.bounds.bottomLeft.add([200,70]);
		}
		textGroup.addChild( newline );
	}

	textGroup.position = paper.view.bounds.center;

	if(textGroup.bounds.width > textGroup.bounds.height){
		paper.view.zoom = paper.view.zoom * (paper.view.bounds.width / textGroup.bounds.width) * 0.65;
	}else{
		paper.view.zoom = paper.view.zoom * (paper.view.bounds.height / textGroup.bounds.height) * 0.55;
	}

	textGroup.applyMatrix = false;
	textBase = textGroup.bounds.center;

	buildGraphic();
}

//(re)creates the blob graphic around a random letter of the current text
function buildGraphic(){
	//collision checks only work with untransformed groups
	textGroup.matrix = new Matrix();
	if(graphicGroup) graphicGroup.remove();

	for(let attempt = 0; attempt < 25; attempt++){
		blobs.concat(lines, decos, littleTexts).forEach(item => item.remove());
		blobs = [];
		lines = [];
		decos = [];
		textBlob = [];
		littleTexts = [];

		centerLetter = _.sample(letters);
		for(let i = 0; i< _.random(8,15); i++){
			setBlob(centerLetter);
		}
		//we need two big blobs to put the little texts on
		if(textBlob.length >= 2) break;
	}

	connectBlobs();
	decorateBlobs();

	let items = project.activeLayer.children.filter(item => item !== textGroup);
	graphicGroup = new Group(items);
	graphicGroup.applyMatrix = false;
	graphicGroup.sendToBack();
	graphicBase = graphicGroup.bounds.center;

	setBlobTexts();
	applyTransforms();
	applyColors();
}

function textLine(text){
	let textwidth = font.getAdvanceWidth(text, 500);
	let fontpaths = font.getPaths(text,(paper.view.viewSize.width-textwidth)/2,0,500);
	let line = new Group();
	for(var i = 0; i<fontpaths.length; i++){
		if(fontpaths[i].commands == 0) continue;

		//import test as SVG into paper
		let paperpath = paper.project.importSVG(fontpaths[i].toSVG());
		paperpath.applyMatrix = true;
		paperpath.rand = Math.random();

		letters.push(paperpath);
		line.addChild(paperpath);
	}
	return line;
}

function tinyFont(text){
	let letterGroup = new Group();
	let fontpaths = font.getPaths(text,0,0,80);

	for(var i = 0; i<fontpaths.length; i++){
		if(fontpaths[i].commands == 0) continue;

		//import test as SVG into paper
		let paperpath = paper.project.importSVG(fontpaths[i].toSVG());
		paperpath.applyMatrix = true;
		letterGroup.addChild(paperpath);
	}
	return letterGroup;
}

//color of the background graphic for a given random seed
function graphicColor(seed){
	let colors = settings.graphicColors;
	if(settings.graphicMode == 'single') return colors[0];
	return colors[seed % colors.length];
}

function resolveColor(spec){
	return spec.role == 'accent' ? settings.accent : graphicColor(spec.seed);
}

//colors all items according to the current settings
function applyColors(){
	document.body.style.backgroundColor = settings.background;

	let colors = settings.textColors;
	let prev = -1;
	letters.forEach((letter, i) => {
		let idx = 0;
		if(settings.letterMode == 'cycle'){
			idx = i % colors.length;
		}else if(settings.letterMode == 'random'){
			let candidates = colors.length > 1 ? _.without(_.range(colors.length), prev) : [0];
			idx = candidates[Math.floor(letter.rand * candidates.length)];
		}
		prev = idx;
		letter.fillColor = colors[idx];
	});
	if(centerLetter && settings.highlightCenter){
		centerLetter.fillColor = graphicColor(0);
	}

	blobs.concat(lines, decos, littleTexts).forEach(item => {
		if(item.colorRole.fill) item.fillColor = resolveColor(item.colorRole.fill);
		if(item.colorRole.stroke) item.strokeColor = resolveColor(item.colorRole.stroke);
	});
}

function applyTransform(group, base, t){
	if(!group || !base) return;
	group.matrix = new Matrix()
		.translate(base.add([t.x, t.y]))
		.rotate(t.rotation)
		.scale(t.scale)
		.translate(base.negate());
}

function applyTransforms(){
	applyTransform(textGroup, textBase, settings.transform.text);
	applyTransform(graphicGroup, graphicBase, settings.transform.graphic);
}

//swaps between light and dark versions of the background graphic
function toggleColor(){
	let twin = graphicPalettes[settings.graphicPalette] && graphicPalettes[settings.graphicPalette].twin;
	if(twin){
		setGraphicPalette(twin);
	}else{
		let bg = settings.background;
		settings.background = settings.graphicColors[0];
		settings.graphicColors[0] = bg;
		settings.accent = settings.background;
		settings.graphicPalette = 'custom';
		settings.shapePalette = 'custom';
	}
	syncUI();
	applyColors();
}

function setGraphicPalette(name){
	let palette = graphicPalettes[name];
	settings.graphicPalette = name;
	settings.background = palette.background;
	settings.shapePalette = name;
	settings.graphicColors = palette.colors.slice();
	settings.accent = palette.accent;
}

//re-randomizes which palette color each letter and shape gets
function shuffleColors(){
	letters.forEach(letter => letter.rand = Math.random());
	blobs.forEach(blob => blob.seed = _.random(0, 1000));
	blobs.concat(lines, decos, littleTexts).forEach(item => {
		['fill', 'stroke'].forEach(prop => {
			let spec = item.colorRole[prop];
			if(spec && spec.role == 'graphic'){
				spec.seed = item.blobRef.seed;
			}
		});
	});
	applyColors();
}

function newLayout(){
	if(textGroup) buildGraphic();
}


function setBlob(letter){
	let circ = new Path.Circle(getBlobPoint(letter), _.random(40,100));
	circ.sendToBack();
	while(hitsOtherShape(circ, blobs)){
		circ.position = getBlobPoint(letter);
	}
	if(!hitsOtherShape(circ, letters) && textBlob.length<2){
		circ.scale(3);
		textBlob.push(circ);
	}
	circ.seed = _.random(0, 1000);
	circ.blobRef = circ;
	circ.colorRole = {fill: {role: 'graphic', seed: circ.seed}};
	circ.fillColor = 'white';
	blobs.push(circ);
}

function setBlobTexts(){
	littleTexts.forEach(text => text.remove());
	littleTexts = [];
	if(settings.showBlobTexts && textBlob.length>1){
		textOnBlob(settings.blobTexts[0], textBlob[0]);
		textOnBlob(settings.blobTexts[1], textBlob[1], [0,10]);
	}
}

function textOnBlob(textLines, blob, offset){
	let rows = textLines
		.map(text => settings.uppercase ? text.toUpperCase() : text)
		.filter(text => text.trim().length > 0)
		.map(text => tinyFont(text));
	if(rows.length == 0) return;

	for(let i = 1; i<rows.length; i++){
		rows[i].bounds.topCenter = rows[i-1].bounds.bottomCenter.add([0,20]);
	}
	let tGroup = new Group(rows);

	tGroup.position = blob.position;
	let w = tGroup.bounds.width;
	let h = tGroup.bounds.height;
	tGroup.scale((blob.bounds.height) / (Math.sqrt(w*w + h*h)) * settings.blobTextSize);
	if(offset){
		tGroup.position = tGroup.position.add(offset);
	}

	//text on filled blobs uses the accent color, otherwise the blob color
	tGroup.blobRef = blob;
	tGroup.colorRole = {fill: blob.colorRole.fill ? {role: 'accent'} : {role: 'graphic', seed: blob.seed}};
	tGroup.fillColor = 'white';
	if(graphicGroup) graphicGroup.addChild(tGroup);
	littleTexts.push(tGroup);
}

function getPointOnRect(rect){
	let rim = rect.expand(50);
	let rec = new Path.Rectangle(rim);
	let rndPoint = rec.getPointAt(_.random(0, rec.length, true));
	rec.remove();
	return rndPoint;
}

function getBlobPoint(shape){
	let recPoint = getPointOnRect(shape.bounds);
	let p = shape.getNearestPoint(recPoint);
	let vec = recPoint.subtract(p).normalize(_.random(200,450));
	return p.add(vec);
}

function hitsOtherShape(shape, shapes){
	for(let i = 0; i<shapes.length; i++){
		if(shapes[i].intersects(shape) || (shape.closed==true && shapes[i].contains(shape.bounds.center) )){
			return true;
		}
	};
	return false;
}

function decorateBlobs(){
	for(let i = 0; i<blobs.length; i++){
		let blob = blobs[i];
		let graphic = {role: 'graphic', seed: blob.seed};

		let variation = _.random(0,2);
		let deco = blob.clone();
		deco.blobRef = blob;
		deco.colorRole = {};

		switch(variation){
			case 0:
				deco.scale(0.8);
				deco.colorRole.fill = _.clone(graphic);
				deco.colorRole.stroke = {role: 'accent'};
				deco.dashArray = getRandomDashArray(deco);
				deco.strokeWidth = _.random(3,12);
				break;
			case 1:
				blob.scale(0.8);
				deco.fillColor = null;
				deco.colorRole.stroke = _.clone(graphic);
				deco.dashArray = getRandomDashArray(deco);
				deco.strokeWidth = _.random(3,12);
				break;
			case 2:
				blob.scale(0.8);
				blob.fillColor = null;
				blob.colorRole = {stroke: _.clone(graphic)};
				blob.strokeWidth = _.random(3,12);
				blob.dashArray = getRandomDashArray(blob);
				deco.fillColor = null;
				deco.colorRole.stroke = _.clone(graphic);
				deco.dashArray = getRandomDashArray(deco);
				deco.strokeWidth = _.random(3,12);
				break;
		}
		decos.push(deco);
	}
}

function getRandomDashArray(shape){
	let partNr = _.random(3,Math.floor(shape.length/20));
	let partLength = shape.length/partNr;
	let gapLength =  _.random(5,11)
	gapLength = gapLength==11 ? 0 : gapLength;
	return [partLength-gapLength, gapLength];
}

function connectBlobs(){

	for(let i = 0; i<blobs.length-1; i++){
		for(let j = i+1; j<blobs.length; j++){

			let line = new Path.Line(blobs[i].position, blobs[j].position);
			line.strokeColor = 'white';
			line.strokeWidth = _.random(3,9);

			let b1 = PaperOffset.offset(blobs[i], 20, { join: 'round', insert:false })
			let b2 = PaperOffset.offset(blobs[j], 20, { join: 'round', insert:false })

			let inters1 = line.getIntersections(b1);
			let rest = line.splitAt(inters1[0]);
			line.remove();
			line = rest;

			let inters2 = line.getIntersections(b2);
			let rest2 = line.splitAt(inters2[0]);
			rest2.remove();

			if(hitsOtherShape(line, lines) || hitsOtherShape(line, blobs)){
				line.remove();
			}else{
				line.blobRef = blobs[i];
				line.colorRole = {stroke: {role: 'graphic', seed: blobs[i].seed}};
				line.sendToBack();
				lines.push(line);
			}
		}
	}
}

//drag text or graphic around on the canvas
function initDrag(){
	let tool = new Tool();
	tool.onMouseDown = function(event){
		dragTarget = null;
		let hit = project.hitTest(event.point, {fill: true, stroke: true, tolerance: 8 / paper.view.zoom});
		let item = hit && hit.item;
		while(item){
			if(item === textGroup){ dragTarget = 'text'; break; }
			if(item === graphicGroup){ dragTarget = 'graphic'; break; }
			item = item.parent;
		}
		document.getElementById('paperCanvas').style.cursor = dragTarget ? 'grabbing' : '';
	};
	tool.onMouseDrag = function(event){
		if(!dragTarget) return;
		let t = settings.transform[dragTarget];
		t.x += event.delta.x;
		t.y += event.delta.y;
		applyTransforms();
		syncTransformInputs();
	};
	tool.onMouseUp = function(){
		dragTarget = null;
		document.getElementById('paperCanvas').style.cursor = '';
	};
}


//canvas zoom in
function zoomIn(){
	paper.view.zoom = paper.view.zoom+0.05;
}

//canvas zoom out
function zoomOut(){
	paper.view.zoom = paper.view.zoom-0.05;
}

function downloadURL(url, filename){
	var downloadLink = document.createElement("a");
	downloadLink.href = url;
	downloadLink.download = filename;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}

//let user download canvas content as SVG
function downloadSVG(){
	let bg = null;
	if(settings.exportBackground){
		bg = new Path.Rectangle(project.activeLayer.bounds.expand(100));
		bg.fillColor = settings.background;
		bg.sendToBack();
	}
	var svg = project.exportSVG({ asString: true, bounds: 'content' });
	if(bg) bg.remove();
	var svgBlob = new Blob([svg], {type:"image/svg+xml;charset=utf-8"});
	downloadURL(URL.createObjectURL(svgBlob), simText+".svg");
}

//let user download canvas content as PNG
function downloadPNG(){
	var canvas = document.getElementById("paperCanvas");
	if(settings.exportBackground){
		let out = document.createElement('canvas');
		out.width = canvas.width;
		out.height = canvas.height;
		let ctx = out.getContext('2d');
		ctx.fillStyle = settings.background;
		ctx.fillRect(0, 0, out.width, out.height);
		ctx.drawImage(canvas, 0, 0);
		canvas = out;
	}
	downloadURL(canvas.toDataURL("image/png"), simText+'.png');
}

function updateText(){
	let inptext = document.getElementById('simulationtext').value.trim();
	if(settings.uppercase) inptext = inptext.toUpperCase();
	if(inptext.length > 0){
		simText = inptext
	}else if(settings.uppercase){
		simText = simText.toUpperCase();
	}
	generate();
}


//options panel

function togglePanel(){
	document.getElementById('panel').classList.toggle('hidden');
}

function byId(id){
	return document.getElementById(id);
}

function initUI(){
	let textSelect = byId('opt-textPalette');
	let graphicSelect = byId('opt-graphicPalette');
	Object.keys(textPalettes).forEach(name => textSelect.add(new Option(name, name)));
	let shapeSelect = byId('opt-shapePalette');
	Object.keys(graphicPalettes).forEach(name => graphicSelect.add(new Option(name, name)));
	//graphic palettes also show up as shape palettes, so choosing one keeps both selects in sync
	Object.keys(graphicPalettes).forEach(name => shapePalettes[name] = shapePalettes[name] || graphicPalettes[name].colors);
	Object.keys(shapePalettes).forEach(name => shapeSelect.add(new Option(name, name)));
	shapeSelect.add(new Option('custom', 'custom'));
	textSelect.add(new Option('custom', 'custom'));
	graphicSelect.add(new Option('custom', 'custom'));

	textSelect.onchange = () => {
		if(textPalettes[textSelect.value]){
			settings.textPalette = textSelect.value;
			settings.textColors = textPalettes[textSelect.value].slice();
			syncUI();
			applyColors();
		}
	};
	graphicSelect.onchange = () => {
		if(graphicPalettes[graphicSelect.value]){
			setGraphicPalette(graphicSelect.value);
			syncUI();
			applyColors();
		}
	};

	shapeSelect.onchange = () => {
		if(shapePalettes[shapeSelect.value]){
			settings.shapePalette = shapeSelect.value;
			settings.graphicColors = shapePalettes[shapeSelect.value].slice();
			syncUI();
			applyColors();
		}
	};

	byId('opt-background').oninput = e => { settings.background = e.target.value; customGraphic(); };
	byId('opt-accent').oninput = e => { settings.accent = e.target.value; customGraphic(); };
	byId('opt-letterMode').onchange = e => { settings.letterMode = e.target.value; applyColors(); };
	byId('opt-graphicMode').onchange = e => { settings.graphicMode = e.target.value; applyColors(); };
	byId('opt-highlightCenter').onchange = e => { settings.highlightCenter = e.target.checked; applyColors(); };
	byId('opt-exportBackground').onchange = e => { settings.exportBackground = e.target.checked; };
	byId('opt-uppercase').onchange = e => {
		settings.uppercase = e.target.checked;
		updateText();
	};

	byId('opt-showBlobTexts').onchange = e => { settings.showBlobTexts = e.target.checked; refreshBlobTexts(); };
	byId('opt-blobTextSize').oninput = e => { settings.blobTextSize = parseFloat(e.target.value); refreshBlobTexts(); };
	[0,1].forEach(b => [0,1].forEach(l => {
		byId('opt-blob' + b + l).oninput = e => { settings.blobTexts[b][l] = e.target.value; refreshBlobTexts(); };
	}));

	byId('opt-transformTarget').onchange = syncTransformInputs;
	['x', 'y', 'scale', 'rotation'].forEach(key => {
		byId('opt-' + key).oninput = e => {
			settings.transform[byId('opt-transformTarget').value][key] = parseFloat(e.target.value);
			applyTransforms();
			syncTransformInputs();
		};
	});

	syncUI();
}

function refreshBlobTexts(){
	if(!graphicGroup) return;
	setBlobTexts();
	applyColors();
}

function customText(){
	settings.textPalette = 'custom';
	byId('opt-textPalette').value = 'custom';
	applyColors();
}

function customGraphic(){
	settings.graphicPalette = 'custom';
	byId('opt-graphicPalette').value = 'custom';
	applyColors();
}

function customShapes(){
	settings.shapePalette = 'custom';
	byId('opt-shapePalette').value = 'custom';
	applyColors();
}

function resetTransform(){
	settings.transform[byId('opt-transformTarget').value] = {x: 0, y: 0, scale: 1, rotation: 0};
	applyTransforms();
	syncTransformInputs();
}

//renders a list of color pickers with add/remove buttons
function renderColorList(container, colors, onChange){
	container.innerHTML = '';
	colors.forEach((color, i) => {
		let input = document.createElement('input');
		input.type = 'color';
		input.value = color;
		input.oninput = () => { colors[i] = input.value; onChange(); };
		container.appendChild(input);
	});
	let remove = document.createElement('button');
	remove.type = 'button';
	remove.textContent = '−';
	remove.disabled = colors.length <= 1;
	remove.onclick = () => { colors.pop(); renderColorList(container, colors, onChange); onChange(); };
	let add = document.createElement('button');
	add.type = 'button';
	add.textContent = '+';
	add.disabled = colors.length >= 8;
	add.onclick = () => { colors.push(_.sample(colors)); renderColorList(container, colors, onChange); onChange(); };
	container.appendChild(remove);
	container.appendChild(add);
}

function syncUI(){
	byId('opt-textPalette').value = settings.textPalette;
	byId('opt-graphicPalette').value = settings.graphicPalette;
	byId('opt-shapePalette').value = settings.shapePalette;
	byId('opt-background').value = settings.background;
	byId('opt-accent').value = settings.accent;
	byId('opt-letterMode').value = settings.letterMode;
	byId('opt-graphicMode').value = settings.graphicMode;
	byId('opt-highlightCenter').checked = settings.highlightCenter;
	byId('opt-exportBackground').checked = settings.exportBackground;
	byId('opt-uppercase').checked = settings.uppercase;
	byId('opt-showBlobTexts').checked = settings.showBlobTexts;
	byId('opt-blobTextSize').value = settings.blobTextSize;
	[0,1].forEach(b => [0,1].forEach(l => byId('opt-blob' + b + l).value = settings.blobTexts[b][l]));
	renderColorList(byId('textColors'), settings.textColors, customText);
	renderColorList(byId('graphicColors'), settings.graphicColors, customShapes);
	syncTransformInputs();
}

function syncTransformInputs(){
	let t = settings.transform[byId('opt-transformTarget').value];
	['x', 'y', 'scale', 'rotation'].forEach(key => {
		byId('opt-' + key).value = t[key];
		byId('val-' + key).textContent = key == 'scale' ? t[key].toFixed(2) : Math.round(t[key]);
	});
}
