// // /** @type {import('next').NextConfig} */
// // const nextConfig = {
// //   // eslint: {
// //   //   ignoreDuringBuilds: true, // Keep your previous setting
// //   },
// //   images: {
// //     remotePatterns: [
// //       {
// //         protocol: "https",
// //         hostname: "res.cloudinary.com",
// //         port: "",
// //         pathname: "/**", // Allow all images from Cloudinary
// //       },
// //     ],
// //   },
// // };




// // export default nextConfig;

// /** @type {import("next").NextConfig} */

// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "res.cloudinary.com",
//       },
//     ],
//   },

//   experimental: {
//     serverActions: {},
//   },
// };

// export default nextConfig;

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn1.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "th.bing.com",
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
