'use strict';

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const ses = require('nodemailer-ses-transport');
const config = require('../config');
const EmailTemplate = require('email-templates').EmailTemplate;
const righto = require('righto');
const winston = require('winston');

const path = require('path');
// setup for mail templete direction
const templatesDir = path.resolve(__dirname, 'mailTemplates');
const template = new EmailTemplate(templatesDir);
const createPDF = require('./PDFmake');

//Aws ses setting for nodemailer
const transporter = nodemailer.createTransport(ses({
	accessKeyId: config.AWS.accessKeyId,
	secretAccessKey: config.AWS.secretAccessKey,
	region: config.AWS.region,
}));

router.post('/', emailSendingRoute);

function emailSendingRoute (req, res) {
	const pdfInfo = req.body.pdfInfo;

	righto.iterate(function* () {
		let err;
		let result;
		[err, result] = yield righto.surely((createPDF.create).bind(createPDF), pdfInfo.items, pdfInfo.receiptNumber);
		if (err) {
			winston.error('pdf generate fail', err);
			res.status(500).json({
				message: 'email failed',
			});
			return;
		}
		const pdfPath = result.fileName;

		const mailInfo = req.body.mailInfo;
		// template parameter, as the templs engined by ejs,
		//you can setup your own porperites there and pass the data from req.body
		const templateData = {
			detail: {
				userName: mailInfo.userName,
				productName: mailInfo.productName,
				content: mailInfo.content,
				footNote: mailInfo.footNote,
				senderName: mailInfo.senderName,
			},
		};

		[err, result] = yield righto.surely((template.render).bind(template), templateData);
		if (err) {
			winston.error('email template generation fail', err);
			res.status(500).json({
				message: 'email failed',
			});
			return;
		}
		const mailData = {
			from: mailInfo.from,
			to: mailInfo.to,
			cc: mailInfo.cc,
			bcc: mailInfo.bcc,
			subject: mailInfo.subject,
			html: result.html, //html generated by email-template
			attachments: [
				{
					path: pdfPath,
				},
				{
					filename: 'example_header_image.jpg',
					path: 'routes/example_header_image.jpg',
					//same cid value as in the html template img src,
					//the cid value should be as unique as possible
					cid: 'uniqueKey:example_header_image:kreata.ee1',
				},
				{
					filename: 'example_hero_image.jpg',
					path: 'routes/example_hero_image.jpg',
					//same cid value as in the html template img src,
					//the cid value should be as unique as possible
					cid: 'uniqueKey:example_hero_image:kreata.ee2',
				},
			],
		};

		[err, result] = yield righto.surely((transporter.sendMail).bind(transporter), mailData);
		if (err) {
			winston.error('email template generation fail', err);
			res.status(500).json({
				message: 'email failed',
			});
			return;
		}
		res.json({
			done: true,
			result,
		});

	})((err) => {
		if (err) {
			winston.err('email sent failure', err);
			res.status(500).json({
				message: 'Soryy email sent fail',
			});
		}
	});
}

module.exports = router;
