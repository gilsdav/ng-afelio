/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,scss,ts}",
        "./user-management/**/*.{html,scss,ts}",
        "./design-system/**/*.{html,scss,ts}",
        "./advanced-search/**/*.{html,scss,ts}",
        "./styles/**/*.{css,scss}"],
    theme: {
        colors: {
            transparent: "transparent",
            action: {
                primary: "#1166EE",
                dark: "#0F5BD4",
                darker: "#001639",
                light: "#2B7DFF",
                lighter: "#F0F6FF",
            },
            success: {
                primary: "#12B159",
                dark: "#098F45",
                darker: "#002D14",
                light: "#15D169",
                lighter: "#E6FAEF",
            },
            danger: {
                primary: "#D7191B",
                dark: "#BF0A0D",
                darker: "#650002",
                light: "#FF3336",
                lighter: "#FEEFEF",
            },
            warning: {
                primary: "#FF7900",
                dark: "#E66D00",
                darker: "#572A02",
                light: "#FF9B40",
                lighter: "#FFF4EB",
            },
            accent: {
                primary: "#FFEE24",
                dark: "#F5E523",
                darker: "#504A01",
                light: "#FFF470",
                lighter: "#FFFDEA",
            },
            brand: {
                primary: "#002F51",
                dark: "#00121F",
                darker: "#000305",
                light: "#004D85",
                lighter: "#E8F4FC",
            },
            grey: {
                "00": "#FFFFFF",
                "01": "#F9FAFB",
                "02": "#F0F1F2",
                "03": "#DEDFE0",
                "04": "#B4B6B8",
                "05": "#9EA1A3",
                "06": "#73777A",
                "07": "#595D61",
                "08": "#3A3E42",
                "09": "#2C3034",
                "10": "#040405"
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
