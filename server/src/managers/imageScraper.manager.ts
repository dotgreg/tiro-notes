var Scraper = require('images-scraper');
import {each} from 'lodash'

const google = new Scraper({
  puppeteer: {
    headless: true,
  },
  tbs: {  // every possible tbs search option, some examples and more info: http://jwebnet.net/advancedgooglesearch.html
    isz: 'm'  // options: l(arge), m(edium), i(cons), etc.
    // itp:  // options: clipart, face, lineart, news, photo
    // ic:   // options: color, gray, trans
    // sur:  // options: fmc (commercial reuse with modification), fc (commercial reuse), fm (noncommercial reuse with modification), f (noncommercial reuse)
  }, 
});

interface iImageInfo {
  url:string
  source: string
  description: string
}
export const imageScrape = async (term:string, resultNb:number = 10):Promise<string[]> => {
    const raw:iImageInfo[] = await google.scrape(term, resultNb);

    // only keep jpg
    let res:string[] = []
    each(raw, image => {
      let matchs = image.url.match(/\.jpeg|\.jpg/g) || []
      // console.log(matchs);
      if (matchs.length > 0) res.push(image.url)
    })

    // console.log('results', raw.length, res.length);  
    return res
}
