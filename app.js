'use strict';

const fs = require('fs');
const path = require('path');
const Homey = require('homey');

const TYPE_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
};

const DEFAULT_IMAGES = [
  {
    name: 'Kitten',
    type: 'image/jpeg',
    path: path.join(__dirname, './assets/images/kitten.jpg'),
  },
  {
    name: 'Aurora',
    type: 'image/jpeg',
    path: path.join(__dirname, './assets/images/aurora.jpg'),
  },
  {
    name: 'Moon',
    type: 'image/jpeg',
    path: path.join(__dirname, './assets/images/moon.jpg'),
  },
];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; const
      v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

module.exports = class extends Homey.App {

  async onInit() {
    this.log('GalleryApp is running...');

    this._settings = await this.homey.settings.get('images');
    this._images = { /* Homey.Image */ };
    this._tokens = { /* Homey.FlowToken */ };

    if (this._settings) {
      this.log('Initializing images...');
      await Promise.all(Object.keys(this._settings).map((id) => {
        return this.initImage({ id });
      }));
    } else {
      this.log('Creating sample images...');
      this._settings = {};
      await Promise.all(DEFAULT_IMAGES.map(async (image) => {
        return this.createImage({
          name: image.name,
          type: image.type,
          data: await fs.promises.readFile(image.path),
        });
      }));
    }
  }

  async initImage({ id }) {
    const image = await this.getImage({ id });

    // Create Homey.Image
    this._images[id] = await this.homey.images.createImage();
    await this._images[id].setPath(image.file);

    // Create Homey.FlowToken
    this._tokens[id] = await this.homey.flow.createToken(id, {
      type: 'image',
      title: image.name,
    });
    await this._tokens[id].setValue(this._images[id]);
  }

  async uninitImage({ id }) {
    if (this._images[id]) {
      this._images[id].unregister().catch(this.error);
    }

    if (this._tokens[id]) {
      this._tokens[id].unregister().catch(this.error);
    }
  }

  async getImages() {
    return this._settings;
  }

  async getImage({ id }) {
    const image = this._settings[id];
    if (!image) {
      throw new Error(`Invalid Image: ${id}`);
    }

    return image;
  }

  async createImage({
    id = uuid(),
    name = 'New Image',
    type = 'image/jpeg',
    data,
  }) {
    const ext = TYPE_MAP[type];
    if (!ext) {
      throw new Error(`Unsupported image type: ${type}`);
    }

    const file = `/userdata/${id}.${ext}`;
    await fs.promises.writeFile(file, data);

    this._settings[id] = {
      name,
      type,
      file,
    };

    await this.homey.settings.set('images', this._settings);
    await this.initImage({ id });

    return this.getImage({ id });
  }

  async deleteImage({ id }) {
    delete this._settings[id];
    await this.homey.settings.set('images', this._settings);

    await this.uninitImage({ id }).catch((err) => this.error(`Error Uniniting Image: ${err.message}`));
  }

};
