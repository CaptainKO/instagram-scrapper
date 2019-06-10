import * as puppeteer from "puppeteer";
import * as fs from "fs";
import { Browser } from "./browser";

export class Instagram extends Browser {
  private BASE_URL = "https://instagram.com";
  constructor() {
    super("Instagram");
  }

  public async visitWithPreviousSession(url?: string) {
    await this.setSession();
    await this.visit(url);
    await this.storeSession();
  }

  public async visit(url?: string) {
    const localUrl = url ? url : this.BASE_URL;
    await this.mainPage.goto(localUrl, { waitUntil: 'networkidle2' });
  }

  public async login(username: string, password: string) {
    await this.visitWithPreviousSession();
    await this.waitFor(1000);
    
    /* Click to login btn */
    let loginBtn = await this.mainPage.$x('//a[contains(text(), "Log in")]');
    await loginBtn[0].click();
    await this.waitFor(2000);

    /* Writing username and password */
    await this.typeLoginInfo(username, password);
    await this.waitFor(2000);

    /* Click to login btn */
    loginBtn = await this.mainPage.$x('//div[contains(text(), "Log In")]');
    await loginBtn[0].click();
    await this.waitFor(2000);
  }

  public async downloadUserImages(username: string) {
    await this.mainPage.goto(this.USER_URL(username), { waitUntil: 'networkidle2' });
    await this.scrollAndDownloadSmallImages(this.mainPage);
  }

  private USER_URL(username: string) {
    return `${this.BASE_URL}/${username}/`;
  }

  private async typeLoginInfo(username: string, password: string) {
    await this.mainPage.type('input[name="username"]', username, { delay: 50 });
    await this.mainPage.type('input[name="password"]', password, { delay: 50 });
  }

  private async scrollAndDownloadSmallImages(page: puppeteer.Page, scrollStep = 250, scrollDelay = 400) {
    let count = 0;
    let availableScrollHeight;

    const filter = this.filterWithMemory();
    const getSrc = (images: Element[]) => images.map((img: Element) => img.getAttribute('src'));

    do {
      availableScrollHeight = await this.scrollByStep(scrollStep);
      count += scrollStep;

      let imageUrls = await page.$$eval('article div img[decoding="auto"]', getSrc);
      imageUrls = await filter(imageUrls);

      this.downloadImages(imageUrls);

      await page.waitFor(scrollDelay);
    } while (count < availableScrollHeight);
  }

  private async scrollAndDownloadBigImages(page: puppeteer.Page, scrollStep = 250, scrollDelay = 400) {
    let count = 0;
    let availableScrollHeight;
    const filter = this.filterWithMemory();
    const getHref = (images: Element[]) => images.map((img) => img.getAttribute('href'));
    do {
      availableScrollHeight = await this.scrollByStep(scrollStep);
      count += scrollStep;
      let imageUrls = await page.$$eval('article div a[href^="/p/"]', getHref);

      imageUrls = await filter(imageUrls);
      this.openNewPageToDownloadImages(imageUrls);
      console.log(imageUrls);
      // this.downloadImages(imageUrls);
      await page.waitFor(scrollDelay);
    } while (count < availableScrollHeight);
  }

  private async scrollByStep(scrollStep: number) {
    return await this.mainPage.evaluate((step) => {

      const getScrollHeight = (element: any) => {
        const { scrollHeight, offsetHeight, clientHeight } = element;
        return Math.max(scrollHeight, offsetHeight, clientHeight)
      };
      const { body } = document;
      const availableScrollHeight = getScrollHeight(body);

      window.scrollBy(0, step);
      return availableScrollHeight;
    }, scrollStep);
  }

  private filterWithMemory() {
    const memory: any[] = [];
    return async (values: any[]) => {
      const filtered: string[] = [];
      for (const value of values) {
        if (memory.includes(value)) {
          continue;
        }
        memory.push(value);
        filtered.push(value);
      }
      return filtered;
    };
  }

  private async openNewPageToDownloadImages(imageUrls: string[]) {
    const getSrc = (images: Element[]) => images.map((img) => img.getAttribute('src'));
    imageUrls.forEach(async (url) => {
      const page = await this.mainBrowser.newPage();
      await page.setViewport({width: 1920, height: 1080});
      await page.goto(this.BASE_URL + url);
      await page.waitForNavigation({waitUntil: "networkidle2"});
      
      const imageUrls = await page.$x('article div img[decoding="auto"]');
      console.log(imageUrls[0]);
      
      // await page.close();

    });
  }

  private async downloadImages(imageUrls: string[]) {
    imageUrls.forEach((url: string) => {
      this.download(url);
    });
  }

  private async download(url: string) {
    if (typeof (url) !== 'string') {
      console.log(url);
      return;
    }
    const page = await this.mainBrowser.newPage();
    const viewSource = await page.goto(url);
    fs.writeFile('./images/' + await page.title() + '.jpg', await viewSource.buffer(),
      (err) => err ? console.log(err) : undefined);
    page.close();
  }
}
