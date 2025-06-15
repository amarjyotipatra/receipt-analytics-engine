export interface GeminiReceiptItem {
  item_name: string;
  item_cost: number;
}

export interface GeminiReceiptData {
  date: string;
  currency: string;
  vendor_name: string;
  receipt_items: GeminiReceiptItem[];
  tax: number;
  total: number;
}
