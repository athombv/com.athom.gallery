'use strict';

module.exports = {
  async getImages({ homey }) {
    return homey.app.getImages();
  },

  async getImage({ homey, params: { id } }) {
    return homey.app.getImage({ id });
  },

  async createImage({ homey, body: { name, type, data } }) {
    return homey.app.createImage({
      name,
      type,
      data: Buffer.from(data, 'base64'),
    });
  },

  async deleteImage({ homey, params: { id } }) {
    await homey.app.deleteImage({ id });
  },
};
