export const MAX_PRODUCT_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ORDER_STATUSES = ['pending', 'paid', 'failed', 'expired', 'refunded', 'cancelled'];

export const isMidtransOrder = (order: any) => String(order?.payment_method || order?.payment_type || '').toLowerCase().includes('midtrans');
export const validateImageFile = (file: File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Format gambar harus JPG, PNG, atau WebP.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'Ukuran gambar maksimal 5MB.';
  return '';
};
export const getItemVariant = (item: any) => item?.variant?.name || item?.variant || item?.selectedVariant || '-';
export const getItemQuantity = (item: any) => Number(item?.quantity || item?.qty || 1);
export const getOrderAddress = (order: any) => order?.shipping_address || order?.address || order?.customer_address || '-';
