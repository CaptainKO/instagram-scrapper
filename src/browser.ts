import { Cookie } from "./cookie";
import * as puppeteer from 'puppeteer';

export class Browser {
  protected mainBrowser: puppeteer.Browser;
  protected mainPage: puppeteer.Page;
  
  private cookieService: Cookie;

  constructor(websiteName: string) {
    this.cookieService = new Cookie(websiteName);
  }

  public async init(options?: puppeteer.LaunchOptions, viewport?: puppeteer.Viewport) {
    try {
      this.mainBrowser = await puppeteer.launch(options ? options : null);
      this.mainPage = (await this.mainBrowser.pages())[0];

      const defaultViewPort: puppeteer.Viewport = { width: 800, height: 600 };
      await this.mainPage.setViewport(viewport ? viewport : defaultViewPort);
    } catch (err) {
      console.log("Couldn't init browser", err);
    }
  }

  public async close() {
    await this.mainBrowser.close();
  }

  public async getPages() {
    return await this.mainBrowser.pages();
  }

  public async openInNewPage(url: string, options?: puppeteer.DirectNavigationOptions) {
    const page = await this.mainBrowser.newPage();
    await page.goto(url, options ? options : { waitUntil: "networkidle2" });
    
    return page;
  }

  public async storeSession() {
    try {
      const session = await this.mainPage.cookies();
      await this.storeCookies(session);
    } catch (err) {
      console.log("Couldn't store session", err);
    }
  }

  public async setSession() {
    try {
      await this.setSessionForPage(this.mainPage);
    } catch (err) {
      console.log("Can't store session for main page", err);
    }
  }

  public async setSessionForPage(page: puppeteer.Page) {
    try {
      const previousSession = await this.getCookies();
      if (previousSession) {
        for (const cookie of previousSession) {
          await page.setCookie(cookie);
        }
        console.log('Session has been loaded in the browser')
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async waitFor(duration: number = 1000) {
    await this.mainPage.waitFor(duration);
  }

  private async storeCookies(cookies: puppeteer.Cookie[]) {
    return await this.cookieService.storeCookies(cookies);
  }

  private async getCookies() {
    return await this.cookieService.getCookies();
  }

  // private async updatePages() {
  //   this.pages = await this.mainBrowser.pages();
  // }
}