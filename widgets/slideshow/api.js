'use strict';

module.exports = {
  async getImages({ homey }) {
    return homey.app.getImages();
  },
};
