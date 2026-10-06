/**
 * Helper utility to get or generate the exact live external product listing URL
 * for eBay, Amazon, Walmart, Temu, or any custom merchant platform.
 */
export function getProductUrl(task) {
  if (!task) return 'https://www.ebay.com';

  // If productUrl is explicitly configured and non-empty
  if (task.productUrl && typeof task.productUrl === 'string' && task.productUrl.trim().length > 0) {
    let url = task.productUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  // Clean title: remove "Step X:" prefixes for cleaner e-commerce search queries
  const cleanTitle = (task.title || '')
    .replace(/^Step\s*\d+\s*:\s*/i, '')
    .trim();

  const platform = (task.platform || '').toLowerCase().trim();

  if (platform.includes('ebay')) {
    return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cleanTitle || 'electronics')}`;
  }
  if (platform.includes('amazon')) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(cleanTitle || 'products')}`;
  }
  if (platform.includes('walmart')) {
    return `https://www.walmart.com/search?q=${encodeURIComponent(cleanTitle || 'products')}`;
  }
  if (platform.includes('temu')) {
    return `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(cleanTitle || 'trending')}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(cleanTitle + ' ' + (task.platform || 'online store'))}`;
}

export function openProductUrl(task, event) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  const url = getProductUrl(task);
  window.open(url, '_blank', 'noopener,noreferrer');
}
