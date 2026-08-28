import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấp phép cho IP mạng ảo của bạn
  allowedDevOrigins: ['26.18.167.45', 'localhost'], 
};

export default nextConfig;