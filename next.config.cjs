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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
