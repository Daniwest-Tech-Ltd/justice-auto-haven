import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEO = ({ title, description, keywords, image, url }: SEOProps) => {
  useEffect(() => {
    const defaultTitle = "Justice Ultimate Automobiles | Kenya's Top Car Importer & Seller";
    const defaultDescription = "Kenya's most trusted car dealer in Westlands, Nairobi. We specialize in Lipa Mdogo Mdogo car loans, brand new & foreign used imports from Japan.";
    const defaultKeywords = "Lipa Mdogo Mdogo cars Kenya, car imports Kenya, car loans Nairobi, buy car Kenya";

    document.title = title ? `${title} | Justice Ultimate Automobiles` : defaultTitle;

    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (property) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    if (description || defaultDescription) {
      updateMetaTag("description", description || defaultDescription);
      updateMetaTag("og:description", description || defaultDescription, true);
      updateMetaTag("twitter:description", description || defaultDescription);
    }

    if (keywords || defaultKeywords) {
      updateMetaTag("keywords", keywords || defaultKeywords);
    }

    if (title) {
      updateMetaTag("og:title", `${title} | Justice Ultimate Automobiles`, true);
      updateMetaTag("twitter:title", `${title} | Justice Ultimate Automobiles`);
    }

    if (image) {
      updateMetaTag("og:image", image, true);
      updateMetaTag("twitter:image", image);
    }

    if (url) {
      updateMetaTag("og:url", url, true);
      updateMetaTag("twitter:url", url);
    }
  }, [title, description, keywords, image, url]);

  return null;
};

export default SEO;
