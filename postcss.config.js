const autoprefixer = require('autoprefixer');
const {
    browsers
} = require('./package.json');

module.exports = {
    plugins: [
        // to edit target browsers: use "browsers" field in package.json
        autoprefixer({
            browsers
        })
    ]
}
