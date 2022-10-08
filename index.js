const { default: axios } = require("axios");
const cheerio = require("cheerio");

class AmazonScrapper {
  static baseURI = "https://amazon.in";
  async getMeta(link, headers = {}) {
    const config = { headers };
    const res = await axios.get(link, config);
    const data = await res.data;
    const $ = cheerio.load(data);

    const title = $('span[id="productTitle"]');
    let description = $('h3[class="product-facts-title"] ~ ul span');
    if (!description.length)
      description = $('h1[class="a-size-base-plus a-text-bold"] ~ ul span');

    const prices = $('div#centerCol span[class="a-offscreen"]');
    // remove /count value
    for(let i=0; i< prices.length; i++){
      if(prices[i].parentNode.attribs['data-a-size'] == 'mini') prices.splice(i, 1)
    }

    let originalPrice = null,
      discountedPrice = null;
    if (prices.length) {
      let amount1 = prices[0].firstChild.data.slice(1);
      let amount2 = prices[1].firstChild.data.slice(1);

      amount1 = parseFloat(amount1.replace(/,/g, ""));
      amount2 = parseFloat(amount2.replace(/,/g, ""));

      if (amount1 < amount2) {
        discountedPrice = prices[0].firstChild.data.split(".")[0];
        originalPrice = prices[1].firstChild.data.split(".")[0];
      } else {
        originalPrice = prices[0].firstChild.data.split(".")[0];
        discountedPrice = prices[1].firstChild.data.split(".")[0];
      }
    }

    const oos = $("div#availability span");
    let productImages = $('li[class="a-spacing-small item"] img');
    let bigImage = $("img#landingImage");

    let des = "";
    if (description.length) {
      for (let li of description) {
        des += li.firstChild.data + "\n";
      }
    }
    description = des;

    if (productImages.length) {
      const arr = [];
      for (let image of productImages) {
        arr.push(image.attribs["src"].split("._")[0] + ".jpg");
      }
      productImages = arr;
    } else {
      if (bigImage.length) productImages = [bigImage[0].attribs["src"]];
    }

    const metaData = {
      status: res.status,
      originalLink: link,
      productImages: productImages.length ? productImages : [],
      title: title.length ? title[0].firstChild.data.trim() : null,
      description: description.length ? description.trim() : null,
      outOfStock: oos.length
        ? oos[0].firstChild.data.includes("Currently unavailable")
        : false,
      originalPrice,
      discountedPrice,
    };
    return metaData;
  }
}

module.exports = AmazonScrapper;
