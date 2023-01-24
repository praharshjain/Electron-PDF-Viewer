const fs = require('fs');
let data = null;
try {
    data = JSON.parse(fs.readFileSync('package.json', 'utf8'));
} catch (err) {
    console.error(err);
}
module.exports = {
    appName: data.name,
    appVersion: data.version,
    appDescription: data.description,
    copyrightInfo: data.copyrightInfo,
    author: data.author,
    website: data.website,
    iconPath: require('path').join(__dirname, 'icon.png'),
}