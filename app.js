'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Homey = require('homey');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const TYPE_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
}
const DEFAULT_IMAGES = [
  {
    name: 'Kitten',
    type: 'image/jpeg',
    path: path.join('./assets/images/kitten.jpg'),
  },
  {
    name: 'Aurora',
    type: 'image/jpeg',
    path: path.join('./assets/images/aurora.jpg'),
  },
  {
    name: 'Moon',
    type: 'image/jpeg',
    path: path.join('./assets/images/moon.jpg'),
  },
]

module.exports = class extends Homey.App {
	
	async onInit() {
		this.log('GalleryApp is running...');
		this._images = Homey.ManagerSettings.get('images');
		if( this._images ) {
  		this.log('Initializing images...');
  		await Promise.all(Object.keys(this._images).map(id => {
    		return this.initImage({ id });
  		}));
    } else {
  		this.log('Clean start, creating sample images...');
  		this._images = {};
  		await Promise.all(DEFAULT_IMAGES.map(async image => {
    		return this.createImage({
      		name: image.name,
      		type: image.type,
      		data: await readFileAsync(image.path),
    		})
  		}));
		}
	}
	
	async initImage({ id }) {
  	this.log('initImage', id);
  	
  	const image = await this.getImage({ id });
  	image.instance = new Homey.Image();
  	image.instance.setPath(image.file);
  	await image.instance.register();
  	
  	image.tag = new Homey.FlowToken(id, {
    	type: 'image',
    	title: image.name,
  	});
  	await image.tag.register();
  	await image.tag.setValue(image.instance);  	
	}
	
	async uninitImage({ id }) {
  	this.log('uninitImage', id);
  	
  	const image = await this.getImage({ id });
  	if( image.instance ) {
    	image.instance.unregister().catch(this.error);
  	}
  	
  	if( image.tag ) {
    	image.tag.unregister().catch(this.error);
  	}
  	
	}
	
	async getImages() {
  	this.log('getImages');
  	
  	return this._images;
	}
	
	async getImage({ id }) {
  	this.log('getImage', id);
  	
  	const image = this._images[id];
  	if(!image)
  	  throw new Error('Cannot find that image');
    return image;
	}
	
	async createImage({ name = 'New Image', type = 'image/jpeg', data }) {
  	this.log('createImage', name, type);
  	
  	const id = uuid();
  	
  	const ext = TYPE_MAP[type];
  	if(!ext)
  	  throw new Error(`Unsupported image type: ${type}`);
  	
  	const file = `./userdata/${id}.${ext}`;
  	await writeFileAsync(file, data);
  	
  	this._images[id] = {
    	name,
    	type,
    	file,
    };
    Homey.ManagerSettings.set('images', this._images);
    await this.initImage({ id });
	}
	
	async deleteImage({ id }) {
  	this.log('deleteImage', id);
  	
    await this.uninitImage({ id });
    
  	delete this._images[id];
    Homey.ManagerSettings.set('images', this._images);  	
	}
	
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
