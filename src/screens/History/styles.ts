import { StyleSheet } from "react-native";

import { THEME } from "../../styles/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.GREY_800,
  },
  history: {
    flexGrow: 1,
    padding: 32,
  },
  swipeableRemove: {
    width: 90,
    height: 90,
    borderRadius: 6,
    backgroundColor: THEME.COLORS.DANGER_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeableContainer: {
    height: 90,
    width: "100%",
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: THEME.COLORS.DANGER_LIGHT,
  },
});
