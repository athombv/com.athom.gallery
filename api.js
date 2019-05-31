'use strict';

const Homey = require('homey');

module.exports = [
  
  {
    method: 'get',
    path: '/image',
    fn: async ( args ) => {
      return Homey.app.getImages();
    }
  },
  
  {
    method: 'get',
    path: '/image/:id',
    fn: async ( args ) => {
      const { id } = args.params;
      return Homey.app.getImage({ id });
    }
  },
  
  {
    method: 'post',
    path: '/image',
    fn: async ( args ) => {
      const { name, type, data: base64 } = args.body;
      const data = Buffer.from(base64, 'base64');
      return Homey.app.createImage({ name, type, data });
    }
  },
  
  {
    method: 'delete',
    path: '/image/:id',
    fn: async ( args ) => {
      const { id } = args.params;
      return Homey.app.deleteImage({ id });
    }
  },
  
];