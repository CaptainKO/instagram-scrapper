import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

const jsonfile = require('jsonfile');

export class Cookie {
  private cookieFilePath: string = "cookies";
  constructor(name: string) {
    this.cookieFilePath = 'cookies' + name;
  }

  public async storeCookies(cookies: puppeteer.Cookie[]) {
    // Save Session Cookies
    // const cookiesObject = await this.page.cookies();
    // Write cookies to temp file to be used in other profile pages
    jsonfile.writeFile(this.cookieFilePath, cookies, { spaces: 2 },
      (err: any) => {
        if (err) {
          console.log('The file could not be written.', err);
          return;
        }
        console.log('Session has been successfully saved');
      });
  }

  public async getCookies() {
    try {
      const previousSession = fs.existsSync(this.cookieFilePath);

      if (previousSession) {
        // If file exist load the cookies
        const cookiesStr = fs.readFileSync(this.cookieFilePath);
        const cookiesArr: any[] = JSON.parse(cookiesStr.toString());
        return cookiesArr;
      }
    } catch (err) {
      console.log(err);
      return [];
    }
  }
}