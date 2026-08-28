export const getProductImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '/placeholder.jpg'; // Trả về ảnh placeholder nếu trống
  
  // Nếu đã là URL tuyệt đối từ Cloudinary (bắt đầu bằng http:// hoặc https://), giữ nguyên tuyệt đối
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Trường hợp dự phòng nếu chuỗi truyền vào chỉ là tên file đơn lẻ
  return imageUrl;
};