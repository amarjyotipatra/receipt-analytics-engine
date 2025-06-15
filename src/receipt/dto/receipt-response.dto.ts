export interface ReceiptItem {
  item_name: string;
  item_cost: number;
}

export interface ReceiptResponse {
  id: string;
  date: string;
  currency: string;
  vendor_name: string;
  receipt_items: ReceiptItem[];
  tax: number;
  total: number;
  image_url: string;
}
