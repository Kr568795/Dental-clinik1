'use strict';

const sequelize = require('../config/db');
const Appointment = require('./appointment');
const Service = require('./service');
const Review = require('./review');
const Setting = require('./setting');
const Admin = require('./admin');
const TeamMember = require('./teamMember');
const GalleryImage = require('./galleryImage');
const FaqItem = require('./faqItem');
const WhyReason = require('./whyReason');

module.exports = {
  sequelize,
  Appointment,
  Service,
  Review,
  Setting,
  Admin,
  TeamMember,
  GalleryImage,
  FaqItem,
  WhyReason,
};
