'use strict';

const fs = require('fs');
const express = require('express');
const router = express.Router();

const PdfPrinter = require('pdfmake');

router.post('/', createPdfRoute);

module.exports = {
	router,
	create: createPDF,
};

function createPdfRoute (req, res) {

	const items = req.body.items;
	const receiptNumber = req.body.receipt_number;

	createPDF(items, receiptNumber, (err, result) => {
		if (err) {
			console.log(err);
		} else {
			res.json({
				done: true,
				result,
			});
		}
	});
}

const fonts = {
	Roboto: {
		normal: 'routes/fonts/Roboto-Regular.ttf',
		bold: 'routes/fonts/Roboto-Medium.ttf',
		italics: 'routes/fonts/Roboto-Italic.ttf',
		bolditalics: 'routes/fonts/Roboto-Italic.ttf',
	},
};
const printer = new PdfPrinter(fonts);

function decimalPlaces (num, dp) {
	const pow = Math.pow(10, dp);
	return (Math.round(num * pow) / pow).toFixed(dp);
}

function createPDF (items, receiptNumber, errback) {
	const ts = Date.now();

	const tableBody = [];
	tableBody.push(['Items', 'Detail', 'Price']);
	let totalPrice = 0;
	items.forEach((item) => {
		const itemPrice = parseFloat(item.price, 10);
		totalPrice += itemPrice;
		const itemInfo = [item.name, item.description, `$${decimalPlaces(itemPrice, 2)}`];
		tableBody.push(itemInfo);
	});
	tableBody.push([' ', ' ', ' ']);
	const totalPriceRow = [{ text: 'Total', bold: true }, '', `$${decimalPlaces(totalPrice, 2)}`];
	tableBody.push(totalPriceRow);

	const docDefinition = {
		content: [
			{
				image: 'routes/githubLogo.png',
				width: 50,
				height: 50,
				absolutePosition: { x: 40, y: 40 },
			},
			{ text: 'THIS IS THE FIRST LINE TEXT', style: 'header' },
			{ text: 'this is the second line text', alignment: 'center' },
			{ text: `Receipt number: ${receiptNumber}`, alignment: 'right', style: 'receipt_number' },
			{ text: ' ' }, // intentinal empty text for blank space
			{
				style: 'tableExample',
				table: {
					// headers are automatically repeated if the table spans over multiple pages
					// you can declare how many rows should be treated as headers
					headerRows: 1,
					widths: ['auto', '*', 'auto'],
					body: tableBody,
				},
				layout: 'headerLineOnly',
			},
			{
			text: 'It is possible to apply multiple styles, by passing an array. This paragraph uses two styles: quote and small. When multiple styles are provided, they are evaluated in the specified order which is important in case they define the same properties',
				style: ['quote', 'small'],
			},
		],
		styles: {
			header: {
				fontSize: 18,
				bold: true,
				alignment: 'center',
				margin: [0, 0, 0, 10],
			},
			receipt_number: {
				fontSize: 9,
				bold: true,
			},
			tableExample: {
				margin: [0, 5, 0, 15],
			},
			tableHeader: {
				bold: true,
				fontSize: 13,
				color: 'black',
			},
			quote: {
				italics: true,
			},
			small: {
				fontSize: 8,
			},
		},
		footer: (currentPage, pageCount) => {
			return {
				columns: [
					{
						text: `page ${currentPage.toString()} of ${pageCount}`,
						absolutePosition: {
							x: 500,
						},
						italics: true,
						fontSize: 10,
					},
					{
						// text: (new Date(ts)).toString().slice(0, 15),
						text: JSON.stringify((new Date(ts)).toJSON()),
						absolutePosition: {
							x: 40,
							y: 0,
						},
						fontSize: 12,
					},
				],
			};
		},
	};

	const fileName = `public/pdf/pdfMake-${Date.now()}.pdf`;
	const writeStream = fs.createWriteStream(fileName);
	const pdfDoc = printer.createPdfKitDocument(docDefinition);
	pdfDoc.pipe(writeStream);
	console.log('hello');

	pdfDoc.end();
	errback(undefined, {
		fileName,
	});
}
