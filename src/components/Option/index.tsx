import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import {
  Canvas,
  Skia,
  Path,
  Circle,
  BlurMask,
  useValue,
  runTiming,
} from "@shopify/react-native-skia";
import { styles } from "./styles";
import { THEME } from "../../styles/theme";
import { useSharedValue } from "react-native-reanimated";

type Props = TouchableOpacityProps & {
  checked: boolean;
  title: string;
};

const CHECK_SIZE = 28;
const CHECK_STROKE = 2;

export function Option({ checked, title, ...rest }: Props) {
  const path = Skia.Path.Make();
  const RADIUS = (CHECK_SIZE - CHECK_STROKE) / 2;
  const CENTER_CIRCLE = RADIUS / 2;
  const circle = useSharedValue(0);
  path.addCircle(CHECK_SIZE, CHECK_SIZE, RADIUS);
  return (
    <TouchableOpacity
      style={[styles.container, checked && styles.checked]}
      {...rest}
    >
      <Text style={styles.title}>{title}</Text>
      <Canvas style={{ height: CHECK_SIZE * 2, width: CHECK_SIZE * 2 }}>
        <Path
          path={path}
          color={THEME.COLORS.GREY_500}
          style={"stroke"}
          strokeWidth={CHECK_STROKE}
        />
        <Path
          path={path}
          color={THEME.COLORS.BRAND_LIGHT}
          style={"stroke"}
          strokeWidth={CHECK_STROKE}
        />

        <Circle
          cx={CHECK_SIZE}
          cy={CHECK_SIZE}
          r={CENTER_CIRCLE}
          color={THEME.COLORS.BRAND_LIGHT}
        >
          <BlurMask blur={4} style={"solid"} />
        </Circle>
      </Canvas>
    </TouchableOpacity>
  );
}
