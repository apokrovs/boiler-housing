import {extendTheme, ThemeConfig} from "@chakra-ui/react"

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: true,
}

const disabledStyles = {
  _disabled: {
    backgroundColor: "ui.main",
  },
}

const theme = extendTheme({
  config,
  colors: {
    ui: {
      main: {
        light: "#FFFFFF",
        dark: "#000000"
      },
      secondary: {
        light: "#936d00",
        dark: "#e3ab00"
      },
      success: {
        light: "#046307",
        dark: "#07870a"
      },
      danger: {
        light: "#a10202",
        dark: "#d30000"
      },
      light: {
        light: "#FAFAFA",
        dark: "#1A202C"
      },
      dark: {
        light: "#1A202C",
        dark: "#FAFAFA"
      },
      darkSlate: {
        light: "#252b3d",
        dark: "#a2acb6"
      },
      dim: {
        light: "#a2acb6",
        dark: "#252b3d"
      },
    },
  },
  components: {
    Button: {
      variants: {
        primary: {
          backgroundColor: "ui.main",
          color: "ui.light",
          _hover: {
            backgroundColor: { light: "#046307", dark: "#07870a" },
          },
          _disabled: {
            ...disabledStyles,
            _hover: {
              ...disabledStyles,
            },
          },
        },
        danger: {
          backgroundColor: "ui.danger",
          color: "ui.light",
          _hover: {
            backgroundColor: { light: "#a10202", dark: "#d30000" },
          },
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            _selected: {
              color: "ui.main",
            },
          },
        },
      },
    },
  },
})

export default theme
