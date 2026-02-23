const fs = require('fs');
const https = require('https');

const url = 'https://m.media-amazon.com/images/I/71d-oY5CItL._AC_UF894,1000_QL80_.jpg';
const dest = 'c:\\Users\\Edward Wearing\\Desktop\\ept-poker-league\\public\\images\\simple-poker-hands.jpg';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    }
};

https.get(url, options, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Status Code: ${res.statusCode}`);
        return;
    }

    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download Completed');
    });
}).on('error', (err) => {
    console.error("Error: ", err.message);
});
