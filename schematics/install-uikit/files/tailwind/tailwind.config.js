/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,scss,ts}", "./styles/**/*.{css,scss}"],
    theme: {
        colors: {
            transparent: "transparent",
            action: {
                primary: "#223598",
                dark: "#223386",
                darker: "#0A1A67",
                light: "#D7DBF0",
                lighter: "#F4F6FF",
            },
            success: {
                primary: "#0FBD43",
                dark: "#0DA53B",
                darker: "#109337",
                light: "#C0F2CF",
                lighter: "#EBF9EF",
            },
            danger: {
                primary: "#D7191B",
                dark: "#BC1011",
                darker: "#970609",
                light: "#FFC1C2",
                lighter: "#FBEDED",
            },
            warning: {
                primary: "#E29D12",
                dark: "#D18D05",
                darker: "#AA7409",
                light: "#F4E2BE",
                lighter: "#FAF5EB",
            },
            grey: {
                "00": "#FFFFFF",
                "01": "#F9FAFB",
                "02": "#E7ECED",
                "03": "#D0D9DC",
                "04": "#B0C0C4",
                "05": "#9EA1A3",
                "06": "#5D717C",
                "07": "#3A4F5E",
                "08": "#26323B",
                "09": "#2C3034",
                "10": "#000000"
            },
        },
        fontFamily: {
            body: ["Roboto", "sans-serif", "system-ui"],
        },
        gap: {
            DEFAULT: "8px",
        },
        screens: {
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px'
        },
        extend: {

            container: {
                center: true,
                padding: {
                    DEFAULT: "1rem",
                },
            },
        },
    },
    corePlugins: {
        container: false,
    },
    plugins: [
        require("postcss-import"),
        require("postcss-nested-ancestors"),
        require("prettier-plugin-tailwindcss")
    ],
};
