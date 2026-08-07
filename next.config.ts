import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：构建产物为纯 HTML/CSS/JS，可部署到任意静态托管。
  output: "export",
  // 静态导出不支持默认图片优化服务，统一关闭。
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
