const path = require('path');
const data = require(path.join(__dirname, '../package.json'));
module.exports = {
    appName: data.productName,
    appVersion: data.version,
    appDescription: data.description,
    copyrightInfo: data.copyright,
    author: data.author,
    website: data.website,
    iconPath: path.join(__dirname, 'icon.png'),
}