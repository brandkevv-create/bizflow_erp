const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Regex to find <table className="..."> lacking whitespace-nowrap
            content = content.replace(/<table\s+className="([^"]+)"/g, (match, classNames) => {
                if (!classNames.includes('whitespace-nowrap')) {
                    modified = true;
                    return `<table className="${classNames} whitespace-nowrap"`;
                }
                return match;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDir(path.join(__dirname, 'src'));
console.log('Done.');
